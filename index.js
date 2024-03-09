SINNERS = require('./sinner.json')
SKILLS = require('./skills.json')
ENEMIES = require('./enemies.json')
EFFECTS = require('./effects.json')

DEBUG_DAMAGE = true
DEBUG_TARGET_EFCTS = true
DEBUG_DAMAGE_STATE = true
const efctLib = require('./modules.js');

// single damage instance
function rollDamage(environment, sinner, skill, target, part, skcpy) {
    var curcoinindex = skcpy['coin']
    skcpy['coins'][curcoinindex]['dynmod'] = 0 // initialize current coin's inherit bonus.
    skcpy['coins'][curcoinindex]['bonusflat'] = 0 // initialize current coin's inherit bonus.
    for (efct of Object.keys(skcpy['skillefct']))    // Prehit skill effects
        efctLib.skills(efct)(environment, sinner, skill, target, part, skill['skillefct'][efct], "PreHit", skcpy)
    for (efct of Object.keys(skcpy['coins'][curcoinindex])) // Prehit coin effects
        efctLib.skills(efct)(environment, sinner, skill, target, part, skill['coins'][curcoinindex][efct], "PreHit", skcpy)
    
    // standard calculation
    skcpy['power'] += skcpy['coinpwr']
    var physRes = (target[part][skcpy['phystype']] - 1) > 0 ? (target[part][skcpy['phystype']] - 1) : (target[part][skcpy['phystype']] - 1)/2
    var sinRes = (target[part][skcpy['sintype']] - 1) > 0 ? (target[part][skcpy['sintype']] - 1) : (target[part][skcpy['sintype']] - 1)/2
    var OlDl = ((sinner['level'] + skcpy['ol']) - target[part]['dl'])/(Math.abs((sinner['level'] + skcpy['ol']) - target[part]['dl']) + 25)
    var numClash = skcpy['clash_num']==undefined ? 0 :skcpy['clash_num'] * 0.03
    var crit = skcpy['crit']==undefined ? 0 : skcpy['crit'] * 0.2
    var obslevel = target['obslevel']==undefined ? 0 :  target['obslevel'] * 0.03

    var dynMult = 1 + skcpy['coins'][curcoinindex]['dynmod'] + efctLib.keywordWithPhysSin(sinner['state'],skcpy['phystype'],skcpy['sintype'],"DealMoreDamage") + efctLib.keywordWithPhysSin(target[part]['state'],skcpy['phystype'],skcpy['sintype'],"TakeMoreDamage")
    if (DEBUG_DAMAGE_STATE) 
        console.log(`BasePow: ${skcpy['power']}, Phys: ${physRes}, Sin: ${sinRes}, OLDL: ${OlDl}, numClash: ${numClash}, crit: ${crit}, obslevel: ${obslevel}, dyn: ${dynMult}`)
    return Math.floor((skcpy['power']) * (1+physRes+sinRes+OlDl+numClash+crit+obslevel) * (dynMult) + skcpy['coins'][curcoinindex]['bonusflat'])
}
function procEffects(environment, sinner, skill, target, part, skcpy) {
    return efctLib.procEffects(environment,sinner,skill,target,part, "Proc", skcpy)
}
function applyEffects(environment, sinner, skill, target, part, skcpy) {
    var curcoinindex = skcpy['coin']
    for (efct of Object.keys(skcpy['skillefct']))    // Apply skill effects
        efctLib.skills(efct)(environment, sinner, skill, target, part, skill['skillefct'][efct], "Apply", skcpy)
    for (efct of Object.keys(skcpy['coins'][curcoinindex])) // Apply coin effects
        efctLib.skills(efct)(environment, sinner, skill, target, part, skill['coins'][curcoinindex][efct], "Apply", skcpy)
}
/* 
Input: environment = Object, sinner = Object, skill = Object, target = Object, Part = String
returns [total damage, new target] 
side effects:
    1) modifies environment
    2) modifies sinner
    3) modifies target
*/
function executeAction(environment, sinner, skillname, target, part, clash_num = 0, crit = 0) {
    var total_damage = 0
    
    var skill = efctLib.findFromName(SKILLS, skillname)
    if (skill == undefined)
        console.log(`Skill [${skillname}] not found`)
    skill['clash_num'] = clash_num
    skill['crit'] = crit
    
    var skcpy = structuredClone(skill) // we modify this as we progress. 
    skcpy['power'] = skill['basepwr'] 
    skcpy['coin'] = 0
    // Activate On Use conditions
    for (efct of Object.keys(skill['skillefct']))
        efctLib.skills(efct)(environment, sinner, skill, target, part, skill['skillefct'][efct], "OnUse", skcpy)
    
    while (skcpy['coin'] < skcpy['coinnum']) {
        // part 1: Skill Damage
        var skillDamage = rollDamage(environment, sinner, skill, target, part, skcpy)
        // part 2: Proc Effect
        var procDamage = procEffects(environment, sinner, skill, target, part, skcpy)
        // part 3: Apply Effect
        applyEffects(environment, sinner, skill, target, part, skcpy)
        
        // Progress coin, reset dynamic modifier.
        if (DEBUG_TARGET_EFCTS && DEBUG_DAMAGE)
        console.log(`Skill damage: ${skillDamage}, Proc Damage: ${procDamage}, ${part} Effects: `, target[part]['state'])
        else {
            if (DEBUG_TARGET_EFCTS)
                console.log(`${part} Effects`, target[part]['state'])
            if (DEBUG_DAMAGE)
                console.log(`Skill damage: ${skillDamage}, Proc Damage: ${procDamage}`)
        }
        total_damage += skillDamage + procDamage
        skcpy['coin'] += 1
    }
    return total_damage
}

gossy = efctLib.findFromName(ENEMIES, "Gossy")
heath = efctLib.findFromName(SINNERS, "RHeath")
ryo = efctLib.findFromName(SINNERS, "WRyo")
don = efctLib.findFromName(SINNERS, "WDon")

DEBUG_DAMAGE_STATE = true
DEBUG_TARGET_EFCTS = true
DEBUG_DAMAGE = true

var damage = 0

don['state']['Charge'] = 10
damage = executeAction({}, don, don['skills'][2], gossy, 'body')

console.log(damage)