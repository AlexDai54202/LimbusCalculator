SINNERS = require('./sinner.json')
SKILLS = require('./skills.json')
ENEMIES = require('./enemies.json')
EFFECTS = require('./effects.json')

DEBUG_DAMAGE_PER_HIT = true
DEBUG_TARGET_EFCTS = true
DEBUG_DAMAGE_STATE = true
STAGGER_TURN = false
const efctLib = require('./modules.js');


// todo: Add stagger features.

// single damage instance
function rollDamage(environment, sinner, skill, target, part, skcpy) {
    return efctLib.rollDamage(environment,sinner,skill,target,part,skcpy)
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
/*  Input: environment = Object, sinner = Object, skill = Object, target = Object, Part = String
    returns damage
    side effects:
        1) modifies environment
        2) modifies sinner
        3) modifies target */
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
        if (DEBUG_TARGET_EFCTS && DEBUG_DAMAGE_PER_HIT)
            console.log(`Coin #${skcpy['coin']+1}: Skill damage: ${skillDamage}, Proc Damage: ${procDamage}, ${part} Effects: `, target[part]['state'])
        else {
            if (DEBUG_TARGET_EFCTS)
                console.log(`${part} Effects`, target[part]['state'])
            if (DEBUG_DAMAGE_PER_HIT)
                console.log(`Coin #${skcpy['coin']+1}: Skill damage: ${skillDamage}, Proc Damage: ${procDamage}`)
        }
        efctLib.TargetTakeDamage(target, part, skillDamage + procDamage)
        total_damage += skillDamage + procDamage
        skcpy['coin'] += 1
    }
    return total_damage
}

gossy = efctLib.findFromName(ENEMIES, "Gossy")
heath = efctLib.findFromName(SINNERS, "RHeath")
ryo = efctLib.findFromName(SINNERS, "WRyo")
don = efctLib.findFromName(SINNERS, "WDon")

DEBUG_DAMAGE_STATE = false
DEBUG_TARGET_EFCTS = true
DEBUG_DAMAGE_PER_HIT = true

var damage = 0
don['state']['Charge'] = 10
damage += executeAction({}, ryo, ryo['skills'][1], gossy, 'body')
damage += executeAction({}, ryo, ryo['skills'][1], gossy, 'body')
damage += executeAction({}, ryo, ryo['skills'][1], gossy, 'body')
damage += executeAction({}, ryo, ryo['skills'][1], gossy, 'body')
damage += executeAction({}, ryo, ryo['skills'][1], gossy, 'body')
damage += executeAction({}, ryo, ryo['skills'][1], gossy, 'body')
damage += executeAction({}, ryo, ryo['skills'][1], gossy, 'body')

console.log(damage)