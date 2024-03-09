EFFECTS = require('./effects.json')
module.exports = {
   skills: function (funcname) {
      var db = {
         "CoinPowerIfSpeedG": this.CoinPowerIfSpeedG,
         "ApplyStandardEffectToEnemy": ApplyStandardEffectToEnemy,
         "ApplyTakeMoreDamageToEnemy": this.ApplyTakeMoreDamageToEnemy,
         "ApplyRuptureToEnemy": this.ApplyRuptureToEnemy,
         "ApplyBleedToEnemy": this.ApplyBleedToEnemy,
         "ApplySinkingToEnemy": this.ApplySinkingToEnemy,
         "ApplyChargeToSelf": this.ApplyChargeToSelf,
         "At10ChargeDealMoreDamage": this.At10ChargeDealMoreDamage,
         "At15ChargeDealMoreDamage": this.At15ChargeDealMoreDamage,
         "WRyoS2CP": this.WRyoS2CP,
         "At10ChargeApplyToEnemy": this.At10ChargeApplyToEnemy,
         "OnUseApplyChargeToSelf": this.OnUseApplyChargeToSelf,
         "DealMoreDamageIfEnemyHPLessThan30": this.DealMoreDamageIfEnemyHPLessThan30,
         "WRyoS3": this.WRyoS3,
         "DoMoreDamage": this.DoMoreDamage,
         "WDonS1": this.WDonS1,
         "WDonS2": this.WDonS2,
         "WDonS3": this.WDonS3
      }
      if (db[funcname] == undefined) {
         if (funcname != "dynmod" && funcname != "bonusflat")
            console.log(`Function [${funcname}] missing from db, returning empty function.`)
         return this.emptyfunc
      } else
         return db[funcname]
   }, emptyfunc: function (environment, sinner, skill, target, part, variable, attackPhase, skcpy) {
   }, WDonS3: function (environment, sinner, skill, target, part, variable, attackPhase, skcpy) {
      if (attackPhase == "PreHit" && sinner['state']['Charge'] >= 10) {
         skcpy['coinpwr'] = skill['coinpwr'] + 4
         sinner['state']['Charge'] -= 10
      }
   }, WDonS2: function (environment, sinner, skill, target, part, variable, attackPhase, skcpy) {
      if (attackPhase == "PreHit" && sinner['state']['Charge'] >= 7) {
         skcpy['coinpwr'] = skill['coinpwr'] + 1
      }
   }, WDonS1: function (environment, sinner, skill, target, part, variable, attackPhase, skcpy) {
      if (attackPhase == "PreHit" && sinner['state']['Charge'] >= 5) {
         skcpy['coinpwr'] = skill['coinpwr'] + 2
      }
   }, DoMoreDamage: function (environment, sinner, skill, target, part, variable, attackPhase, skcpy) {
      skcpy['coins'][skcpy['coin']]['dynmod'] += variable
   }, WRyoS3: function (environment, sinner, skill, target, part, variable, attackPhase, skcpy) {
      if (attackPhase == "PreHit" && sinner['state']['Charge'] >= 7) {
         skcpy['coinpwr'] = skill['coinpwr'] + 5
         sinner['state']['Charge'] -= 15
         if (sinner['state']['Charge'] <= 0) {
            delete sinner['state']['Charge']
         }
      }
   }, DealMoreDamageIfEnemyHPLessThan30: function (environment, sinner, skill, target, part, variable, attackPhase, skcpy) {
      if (attackPhase == "PreHit" && target[part]['hp'] / target[part]['maxhp'] <= 0.3) {
         AddToStatus(skcpy['coins'][skcpy['coin']], 'dynmod', variable)
      }
   }, WRyoS2CP: function (environment, sinner, skill, target, part, variable, attackPhase, skcpy) {
      if (attackPhase == "PreHit" && sinner['state']['Charge'] >= 10) {
         skcpy['coinpwr'] = skill['coinpwr'] + 1
      }

      if (attackPhase == "PreHit" && sinner['state']['Charge'] >= 15) {
         skcpy['coinpwr'] = skill['coinpwr'] + 2
      }
   }, At10ChargeApplyToEnemy: function (environment, sinner, skill, target, part, variable, attackPhase, skcpy) {
      if (attackPhase == "Apply" && sinner['state']['Charge'] >= 10) {
         ApplyStandardEffectToEnemy(environment, sinner, skill, target, part, variable, attackPhase, skcpy)
      }
   }, At10ChargeDealMoreDamage: function (environment, sinner, skill, target, part, variable, attackPhase, skill_progression) {
      if (attackPhase == "PreHit" && sinner['state']['Charge'] >= 10) {
         AddToStatus(skill_progression['coins'][skill_progression['coin']], 'dynmod', variable)
      }
   }, At15ChargeDealMoreDamage: function (environment, sinner, skill, target, part, variable, attackPhase, skill_progression) {
      if (attackPhase == "PreHit" && sinner['state']['Charge'] >= 15) {
         AddToStatus(skill_progression['coins'][skill_progression['coin']], 'dynmod', variable)
      }
   }, ApplyTakeMoreDamageToEnemy: function (environment, sinner, skill, target, part, variable, attackPhase, skill_progression) {
      ApplyStandardEffectToEnemy(environment, sinner, skill, target, part, ["TakeMoreDamage", variable], attackPhase, skill_progression)
   }, ApplyRuptureToEnemy: function (environment, sinner, skill, target, part, variable, attackPhase, skill_progression) {
      ApplyStandardEffectToEnemy(environment, sinner, skill, target, part, ["Rupture", variable[0], variable[1]], attackPhase, skill_progression)
   }, CoinPowerIfSpeedG: function (environment, sinner, skill, target, part, variable, attackPhase, skill_progression) {
      if (attackPhase == "PreHit" && sinner['speed'] >= variable[0]) {
         skill_progression['coinpwr'] = skill['coinpwr'] + variable[1]
      }
   }, ApplyBleedToEnemy: function (environment, sinner, skill, target, part, variable, attackPhase, skill_progression) {
      ApplyStandardEffectToEnemy(environment, sinner, skill, target, part, ["Bleed", variable[0], variable[1]], attackPhase, skill_progression)
   }, ApplySinkingToEnemy: function (environment, sinner, skill, target, part, variable, attackPhase, skill_progression) {
      ApplyStandardEffectToEnemy(environment, sinner, skill, target, part, ["Sinking", variable[0], variable[1]], attackPhase, skill_progression)
   }, OnUseApplyChargeToSelf: function (environment, sinner, skill, target, part, variable, attackPhase, skill_progression) {
      if (attackPhase == "OnUse") {
         if ("Charge" in sinner['state'])
            sinner['state']["Charge"] += variable
         else
            sinner['state']["Charge"] = variable
      }
   }, ApplyChargeToSelf: function (environment, sinner, skill, target, part, variable, attackPhase, skill_progression) {
      if (attackPhase == "Apply") {
         if ("Charge" in sinner['state'])
            sinner['state']["Charge"] += variable
         else
            sinner['state']["Charge"] = variable
      }
   }, TargetTakeDamage: function (target, part, damage) {
      target['hp'] -= damage
      target[part]['hp'] -= damage
      for (staggerThresh of target[part]['staggerthresh']) {   
         if (target[part]['hp']/target[part]['maxhp'] <= staggerThresh/100) {
            console.log("*** TARGET IS STAGGERED. ***")
            
            if (target[part]['canbestaggered'] == true) {   
               target[part]['stagger'] += 1
            }
            target[part]['staggerthresh'].shift()
         }
      }
      
   }, rollDamage : function(environment, sinner, skill, target, part, skcpy) {
      var curcoinindex = skcpy['coin']
      skcpy['coins'][curcoinindex]['dynmod'] = 0 // initialize current coin's inherit bonus.
      skcpy['coins'][curcoinindex]['bonusflat'] = 0 // initialize current coin's inherit bonus.
      for (efct of Object.keys(skcpy['skillefct']))    // Prehit skill effects
          this.skills(efct)(environment, sinner, skill, target, part, skill['skillefct'][efct], "PreHit", skcpy)
      for (efct of Object.keys(skcpy['coins'][curcoinindex])) // Prehit coin effects
          this.skills(efct)(environment, sinner, skill, target, part, skill['coins'][curcoinindex][efct], "PreHit", skcpy)
      
      // standard calculation
      skcpy['power'] += skcpy['coinpwr'] + this.keywordWithPhysSin(sinner['state'],skcpy['phystype'],skcpy['sintype'],"CoinPower")
      var physRes = (target[part][skcpy['phystype']] - 1) > 0 ? (target[part][skcpy['phystype']] - 1) : (target[part][skcpy['phystype']] - 1)/2
      if (target[part]['stagger'] != 0) {
         physRes = 1 + (target[part]['stagger'] - 1) * 0.5
      }
      var sinRes = (target[part][skcpy['sintype']] - 1) > 0 ? (target[part][skcpy['sintype']] - 1) : (target[part][skcpy['sintype']] - 1)/2
      var OlDl = ((sinner['level'] + skcpy['ol']) - target[part]['dl'])/(Math.abs((sinner['level'] + skcpy['ol']) - target[part]['dl']) + 25)
      var numClash = skcpy['clash_num']==undefined ? 0 :skcpy['clash_num'] * 0.03
      var crit = skcpy['crit']==undefined ? 0 : skcpy['crit'] * 0.2
      var obslevel = target['obslevel']==undefined ? 0 :  target['obslevel'] * 0.03
   
      var dynMult = 1 + skcpy['coins'][curcoinindex]['dynmod'] + this.keywordWithPhysSin(sinner['state'],skcpy['phystype'],skcpy['sintype'],"DealMoreDamage") + this.keywordWithPhysSin(target[part]['state'],skcpy['phystype'],skcpy['sintype'],"TakeMoreDamage")
      if (DEBUG_DAMAGE_STATE) 
          console.log(`BasePow: ${skcpy['power']}, Phys: ${physRes}, Sin: ${sinRes}, OLDL: ${OlDl}, numClash: ${numClash}, crit: ${crit}, obslevel: ${obslevel}, dyn: ${dynMult}`)
      return Math.floor((skcpy['power']) * (1+physRes+sinRes+OlDl+numClash+crit+obslevel) * (dynMult) + skcpy['coins'][curcoinindex]['bonusflat'])
  }, 
   keywordWithPhysSin: function (state, phys, sin, keyword) {
      var ret = 0
      for (efct of Object.keys(state)) {
         if (efct.includes(keyword) && (efct == keyword || efct.includes(phys) || efct.includes(sin))) {
            ret += state[efct]
         }
      }
      return ret
   },findFromName: function (jsonlib, name) {
      for (json of jsonlib) {
         if (json['name'] == name) {
            return structuredClone(json)
         }
      }
   },
   procEffects: function (environment, sinner, skill, target, part, attackPhase, skill_progression) {
      var total_proc_damage = 0;
      for (efct of Object.keys(target[part]['state'])) {
         // iterate over all damaging ally effects.
         switch (efct) {
            case 'Rupture':
               total_proc_damage += target[part]['state'][efct][0]
               target[part]['state'][efct][1] -= 1
               if (target[part]['state'][efct][1] == 0)
                  delete target[part]['state'][efct]
               break
            case 'Sinking':
               total_proc_damage += target[part]['state'][efct][0] * target[part]['gloom']
               target[part]['state'][efct][1] -= 1
               if (target[part]['state'][efct][1] == 0)
                  delete target[part]['state'][efct]
               break
            case 'Talisman':
               if ("ApplyRuptureToEnemy" in skill_progression['coins'][skill_progression['coin']]) {
                  skill_progression['coins'][skill_progression['coin']]["ApplyRuptureToEnemy"][1] += target[part]['state'][efct]
               } else {
                  skill_progression['coins'][skill_progression['coin']]["ApplyRuptureToEnemy"] = ["Rupture", target[part]['state'][efct], 0]
               }
               break
         }
      }
      for (efct of Object.keys(sinner['state'])) {
         // iterate over all damaging ally effects.
         switch (efct) {
            case 'Talisman':
               if ("ApplyRuptureToEnemy" in skill_progression['coins'][skill_progression['coin']]) {
                  skill_progression['coins'][skill_progression['coin']]["ApplyRuptureToEnemy"][1] += target[part]['state'][efct]
               } else {
                  skill_progression['coins'][skill_progression['coin']]["ApplyRuptureToEnemy"] = ["Rupture", target[part]['state'][efct], 0]
               }
         }
      }
      return total_proc_damage
   }
}
function ApplyStandardEffectToEnemy(environment, sinner, skill, target, part, variable, attackPhase, skill_progression) {
   if (attackPhase == "Apply") {
      if (variable.length > 2) {
         // effect with count
         if (variable[0] in target[part]['state']) {
            target[part]['state'][variable[0]][0] += variable[1] // add to potency
            target[part]['state'][variable[0]][1] += variable[2] // add to count
         } else {
            // add
            target[part]['state'][variable[0]] = [variable[1] == 0 ? 1 : variable[1], variable[2] == 0 ? 1 : variable[2]]
         }
      } else {
         // effect without count
         if (variable[0] in target[part]['state'])
            target[part]['state'][variable[0]] += variable[1]
         else
            target[part]['state'][variable[0]] = variable[1]
      }
   }
}
function AddToStatus(dict, key, val) {
   if (key in dict) {
      dict[key] += val
   } else {
      dict[key] = val
   }
}
