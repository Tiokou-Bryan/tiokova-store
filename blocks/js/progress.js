/* =========================================================
   TIOKOVA BLOCKS — progress.js
   Tout ce qui fait REVENIR le joueur :
   pièces (monnaie), niveaux, série de jours, missions du jour,
   succès, coffre gratuit.
   ========================================================= */
(function () {
  'use strict';
  const TK = (window.TK = window.TK || {});

  function S() { return TK.Store.data; }

  const P = {
    listeners: [],

    // Les écrans s'abonnent pour se mettre à jour (pièces, niveau…)
    onChange: function (fn) { this.listeners.push(fn); },
    emit: function () { this.listeners.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } }); },

    /* ---------- MONNAIE ---------- */
    addCoins: function (n, silent) {
      if (!n) return;
      const d = S();
      d.coins = Math.max(0, d.coins + n);
      if (n > 0) {
        d.stats.coinsEarned += n;
        if (!silent) TK.Audio.coin();
      }
      TK.Store.saveSoon();
      this.emit();
    },

    spend: function (n) {
      const d = S();
      if (d.coins < n) return false;
      d.coins -= n;
      TK.Store.saveSoon();
      this.emit();
      return true;
    },

    // Donne un lot de récompenses { coins, hammer, bomb, shuffle, freeze }
    grant: function (reward, silent) {
      if (!reward) return;
      const d = S();
      if (reward.coins) this.addCoins(reward.coins, silent);
      ['hammer', 'bomb', 'shuffle', 'freeze'].forEach(function (k) {
        if (reward[k]) d.inv[k] = (d.inv[k] || 0) + reward[k];
      });
      TK.Store.saveSoon();
      this.emit();
    },

    /* ---------- NIVEAU / XP ---------- */
    // Renvoie le nombre de niveaux gagnés
    addXP: function (n) {
      const d = S();
      d.xp += Math.max(0, Math.round(n));
      let ups = 0;
      while (d.xp >= TK.xpForLevel(d.level)) {
        d.xp -= TK.xpForLevel(d.level);
        d.level++;
        ups++;
      }
      if (ups) {
        d.coins += 25 * ups;   // cadeau de niveau
        d.stats.coinsEarned += 25 * ups;
      }
      TK.Store.saveSoon();
      this.emit();
      return ups;
    },

    xpProgress: function () {
      const d = S();
      return d.xp / TK.xpForLevel(d.level);
    },

    /* ---------- SÉRIE DE JOURS ----------
       Appelé au démarrage. Renvoie la récompense du jour
       si c'est la première visite de la journée. */
    checkStreak: function () {
      const d = S();
      const today = TK.dayKey();
      const st = d.streak;
      if (st.last === today) return null; // déjà compté aujourd'hui

      let usedFreeze = false;
      let lost = false;
      const prev = st.count;
      if (!st.last) {
        st.count = 1;
      } else {
        const gap = TK.dayDiff(st.last, today);
        if (gap === 1) {
          st.count++;
        } else if (gap === 2 && d.inv.freeze > 0) {
          // un jour raté mais le joueur avait un "gel de série"
          d.inv.freeze--;
          st.count++;
          usedFreeze = true;
        } else if (gap > 1) {
          lost = prev > 1;
          st.count = 1;
        }
      }
      st.last = today;
      if (st.count > st.best) st.best = st.count;
      d.stats.streakBest = st.best;

      const reward = TK.STREAK_REWARDS[(st.count - 1) % 7];
      this.grant(reward, true);
      TK.Store.save();
      return { count: st.count, reward: reward, usedFreeze: usedFreeze, lost: lost, lostCount: prev };
    },

    /* ---------- MISSIONS DU JOUR ---------- */
    ensureMissions: function () {
      const d = S();
      const today = TK.dayKey();
      if (d.missions.date === today && d.missions.list.length) return;
      // Graine = date : tout le monde a les mêmes missions le même jour
      const rng = new TK.RNG(TK.hashString('missions-' + today));
      const pool = TK.MISSION_POOL.slice();
      const list = [];
      // difficulté : facile, moyenne, difficile (selon le niveau du joueur)
      const tiers = d.level < 4 ? [0, 0, 1] : d.level < 10 ? [0, 1, 2] : [1, 1, 2];
      for (let k = 0; k < 3 && pool.length; k++) {
        const m = pool.splice(rng.int(pool.length), 1)[0];
        const t = tiers[k];
        list.push({ id: m.id, stat: m.stat, mode: m.mode, target: m.targets[t], reward: m.reward[t], claimed: false });
      }
      d.missions = { date: today, list: list, progress: {}, bonusClaimed: false };
      TK.Store.save();
    },

    // Met à jour une statistique du jour (lignes, parties…)
    track: function (stat, value) {
      this.ensureMissions();
      const m = S().missions;
      const def = TK.MISSION_POOL.find(function (x) { return x.stat === stat; });
      const mode = def ? def.mode : 'sum';
      const cur = m.progress[stat] || 0;
      m.progress[stat] = mode === 'max' ? Math.max(cur, value) : cur + value;
      TK.Store.saveSoon();
    },

    missionProgress: function (mis) {
      const v = S().missions.progress[mis.stat] || 0;
      return Math.min(v, mis.target);
    },

    missionDone: function (mis) { return this.missionProgress(mis) >= mis.target; },

    // Nombre de missions terminées mais pas encore réclamées
    missionsToClaim: function () {
      this.ensureMissions();
      const self = this;
      const m = S().missions;
      let n = m.list.filter(function (x) { return !x.claimed && self.missionDone(x); }).length;
      if (!m.bonusClaimed && m.list.every(function (x) { return x.claimed; })) n++;
      return n;
    },

    claimMission: function (k) {
      const m = S().missions;
      const mis = m.list[k];
      if (!mis || mis.claimed || !this.missionDone(mis)) return null;
      mis.claimed = true;
      S().stats.missionsDone++;
      this.addCoins(mis.reward);
      this.checkAchievements();
      return mis.reward;
    },

    claimMissionBonus: function () {
      const m = S().missions;
      if (m.bonusClaimed || !m.list.every(function (x) { return x.claimed; })) return null;
      m.bonusClaimed = true;
      this.grant(TK.MISSIONS_BONUS);
      return TK.MISSIONS_BONUS;
    },

    /* ---------- SUCCÈS ---------- */
    statValue: function (stat) {
      const d = S();
      if (stat === 'level') return d.level;
      if (stat === 'themesOwned') return d.themes.length;
      if (stat === 'streakBest') return d.streak.best;
      return d.stats[stat] || 0;
    },

    // Vérifie les succès débloqués. Renvoie la liste des nouveaux.
    checkAchievements: function () {
      const d = S();
      const fresh = [];
      const self = this;
      TK.ACHIEVEMENTS.forEach(function (a) {
        if (d.ach.unlocked[a.id]) return;
        if (self.statValue(a.stat) >= a.target) {
          d.ach.unlocked[a.id] = Date.now();
          fresh.push(a);
        }
      });
      if (fresh.length) {
        TK.Store.saveSoon();
        this.emit();
        fresh.forEach(function (a) {
          if (TK.UI) TK.UI.toast(a.icon + ' ' + TK.t('ach_unlocked') + ' : ' + TK.t('ach_' + a.id), 'gold');
        });
      }
      return fresh;
    },

    achToClaim: function () {
      const d = S();
      return TK.ACHIEVEMENTS.filter(function (a) { return d.ach.unlocked[a.id] && !d.ach.claimed[a.id]; }).length;
    },

    claimAchievement: function (id) {
      const d = S();
      const a = TK.ACHIEVEMENTS.find(function (x) { return x.id === id; });
      if (!a || !d.ach.unlocked[id] || d.ach.claimed[id]) return null;
      d.ach.claimed[id] = true;
      this.addCoins(a.reward);
      return a.reward;
    },

    /* ---------- COFFRE GRATUIT (toutes les 3 h) ---------- */
    chestReadyIn: function () {
      const next = S().chestAt + TK.CHEST_HOURS * 3600000;
      return Math.max(0, next - Date.now());
    },

    openChest: function () {
      if (this.chestReadyIn() > 0) return null;
      const d = S();
      d.chestAt = Date.now();
      // récompense variable : la surprise donne envie de revenir
      const roll = Math.random();
      const reward = { coins: 15 + Math.floor(Math.random() * 26) };
      if (roll > 0.85) reward.bomb = 1;
      else if (roll > 0.65) reward.shuffle = 1;
      else if (roll > 0.45) reward.hammer = 1;
      this.grant(reward);
      TK.Store.save();
      return reward;
    },

    /* ---------- DÉFI DU JOUR ---------- */
    starsFor: function (score) {
      let s = 0;
      TK.DAILY_STARS.forEach(function (th) { if (score >= th) s++; });
      return s;
    },

    // Enregistre un résultat de défi. Renvoie les pièces gagnées.
    recordDaily: function (dateKey, score) {
      const d = S();
      const rec = d.daily[dateKey] || { best: 0, stars: 0, rewardedStars: -1 };
      const first = rec.rewardedStars < 0;
      rec.best = Math.max(rec.best, score);
      const stars = this.starsFor(score);
      rec.stars = Math.max(rec.stars, stars);
      let coins = 0;
      if (first) {
        coins += 30;                      // participation
        d.stats.dailyDone++;
        rec.rewardedStars = 0;
      }
      if (rec.stars > rec.rewardedStars) {
        coins += (rec.stars - rec.rewardedStars) * 30;  // 30 par nouvelle étoile
        if (rec.stars === 3 && rec.rewardedStars < 3) d.stats.threeStars++;
        rec.rewardedStars = rec.stars;
      }
      d.daily[dateKey] = rec;
      this.track('daily', first ? 1 : 0);
      this.track('stars', stars);
      if (coins) this.addCoins(coins, true);
      TK.Store.save();
      return { coins: coins, stars: stars, best: rec.best, first: first };
    }
  };

  TK.Progress = P;
})();
