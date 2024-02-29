SKILLS = require('./skills.json')
enemies = require('./enemies.json')
EFFECTS = require('./effects.json')
UNITLEVEL = 40
DEBUG = false

function calculate_standard(base, weakphys, weaksin, enemydef, allyatk, numclash, crit, obslvl, dyn) {
    let convertedphys = ((weakphys - 1) > 0 ? (weakphys - 1) : (weakphys - 1) / 2)
    let convertedsin = ((weaksin - 1) > 0 ? (weaksin - 1) : (weaksin - 1) / 2)
    let convertedatk = (allyatk - enemydef) / (Math.abs(allyatk - enemydef) + 25)
    let convertedcrit = (crit ? .2 : 0)
    return base * (1 + convertedphys + convertedsin + convertedatk + 0.03 * numclash + convertedcrit + 0.03 * obslvl) * (dyn)
}


function init_target(targetname) {
    var target;
    for (i in enemies) {
        if (enemies[i]['name'] == targetname) {
            target = enemies[i]
            break
        }
    }
    for (i in target['part']) {
        target['part'][i]['state'] = {}
    }
    target['state'] = {}
    return target
}

function add_condition(cur_conditions, newcondition, amount) {
    // effect already in list
    for (effect of Object.keys(cur_conditions)) {
        if (effect == newcondition) {
            cur_conditions[effect] += amount
            return cur_conditions
        }
    }
    // effect doesn't exist yet
    if ("count_" == newcondition.substring(0,6)) { // for count +X when effect doesn't exist
        cur_conditions[newcondition] = amount
        cur_conditions[newcondition.substring(6)] = 1
    }
    switch (newcondition) {
        case 'rupt':
        case 'sink':
        case 'blee':
        case 'trem':
        case 'burn':
        case 'pois':
            cur_conditions[newcondition] = amount
            if (cur_conditions["count_" + newcondition] == null) {
                cur_conditions["count_" + newcondition] = 1
            }
            return cur_conditions
        default:
            cur_conditions[newcondition] = amount
            return cur_conditions
    }
}

function apply_effects(target, effects, flag) {
    // effect is effect to apply.
    // flag is the flag that much be checked to apply.
    // apply effect to target if flag exists on effect.
    cur_conditions = target['state']
    for (var effect of Object.keys(effects)) {
        if (flag == effect.substring(0, flag.length))
        cur_conditions = add_condition(cur_conditions, effect.substring(flag.length), effects[effect])
    }
    target['state'] = cur_conditions
}

function procefct_on_enemy(target) {
    state = target['state']
    var ret = 0
    // proc status first
    for (effect of Object.keys(state)) {
        switch (effect) {
            case 'rupt':
                ret += state[effect]
                break
            case 'sink':
                ret += state[effect] * target['gloom']
                break
        }
    }
    // then decrement/increment status
    for (effect of Object.keys(state)) {
        if (effect.includes("count_") && EFFECTS[effect]['dec_on_hit']) {
            state[effect] -= 1
            if (state[effect] <= 0) {
                delete state[effect]
                delete state[effect.slice(6)]
            }
        }
        switch (effect) {
            case 'tali':
                if ('rupt' in state) {
                    state['rupt'] += state['tali']
                } else {
                    state['rupt'] = state['tali']
                    state['count_rupt'] = 1
                }
                break
        }
    }
    return ret
}
function parse_if_condition(target, tokens) {
    var comparison_variable = tokens[1] // charge,rupture,etc.
    var comparison_type = tokens[2] // ge/le
    var comparison_value = parseInt(tokens[3]) // numeric
    if (comparison_type == 'ge') {
        return (target['state'][comparison_variable] >= comparison_value)
    } else {
        return (target['state'][comparison_variable] <= comparison_value)
    }
}
function get_relevant(target, skill, target_effect, coin = -1) {
    /*
    returns relevant buff information, search from status if coin = -1.
    if coin = 0/1/2/3/4 then search from skill as well, and add to return value.

    edge case:  frag = Target Dynamic modifiers, aka fragile, etc.
                damg = Ally Dynamic modifiers, aka damage up, etc.
    
    if EFFECTS[target_effect]['hasType'] == true, then also search for target_effect[skill[phystype]] and target_effect[skill[sintype]]
    in the status.
    */

    // currently held effects. should have like fragile, damage up, etc.
    var tot_effect = 0
    statuses = target['state']
    for (effect of Object.keys(statuses)) {
        // this is unlikely to be used. perhaps BLSang passive, or molar ish passive.
        if ("if_" == effect.substring(0, 3)) {
            tokens = effect.split("_")
            if (parse_if_condition(target, tokens)) {
                effect = statuses[effect]
            }
        }
        if ((effect.includes(target_effect)) && !(effect.includes("NEXT_"))) {
            if (EFFECTS[target_effect]['has_type'] && (effect.includes(skill['phystype']) || effect.includes(skill['sintype']))) {
                tot_effect += statuses[effect]
            } else if (effect == target_effect) {
                tot_effect += statuses[effect]
            }
        }
    }
    // skill effects. stuff like "+30% damage on hit"
    if (coin != -1) {
        // We assume that if coin != -1, then target = ally, not enemy.
        // overall skill part.
        skill_effects = skill['skillefct']
        for (effect of Object.keys(skill_effects)) {
            if ("SKILL_if_" == effect.substring(0, 9)) {
                tokens = effect.split("_")
                tokens.shift()
                if (parse_if_condition(target, tokens) == true) {
                    // unwrap effect.
                    var [newefctkey, newefctval] = Object.entries(skill_effects[effect])[0]
                    if ("SKILL_" == newefctkey.substring(0, 6) && newefctkey.includes(target_effect)) {
                        tot_effect += newefctval
                    }
                } else {
                    effect = ""
                }
            } else if ("SKILL_" == effect.substring(0, 6) && effect.includes(target_effect)) {
                tot_effect += skill_effects[effect]
            }
        }
        // coin part
        skill_effects = skill['coins'][i]
        for (effect of Object.keys(skill_effects)) {
            if ("SKILL_if_" == effect.substring(0, 9)) {
                tokens = effect.split("_")
                tokens.shift()
                if (parse_if_condition(target, tokens) == true) {
                    // unwrap effect.
                    var [newefctkey, newefctval] = Object.entries(skill_effects[effect])[0]
                    if ("SKILL_" == newefctkey.substring(0, 6) && newefctkey.includes(target_effect)) {
                        tot_effect += newefctval
                    }
                } else {
                    effect = ""
                }
            } else if ("SKILL_" == effect.substring(0, 6) && effect.includes(target_effect)) {
                tot_effect += skill_effects[effect]
            }
        }
    }
    return tot_effect
}

function hit_target_with_skill(sinner, skillnum, target, partid = 0, numclash = 0, crit = false, obslvl = 0, dyn = 1) {
    var skill;
    for (i in SKILLS) {
        if (SKILLS[i]["skillname"] == sinner['skill'][skillnum]) {
            skill = SKILLS[i]
            break
        }
    }
    if (skill == null) {
        console.log("Err, skill not found")
        return null
    }
    var totdmg = 0;

    var specified_target = target["part"][partid]
    /*
    Blueprint:
    1.  On use, applies effects to enemies and self alike.
    2.  Damage portion.
    */
    var base_roll = skill['basepwr'] + get_relevant(sinner, skill, "fpwr")
    apply_effects(specified_target, skill['skillefct'], "ONUSE_APPLY_")
    apply_effects(sinner, skill['skillefct'], "ONUSE_APPLYself_")
    for (var i = 0; i < skill['coinnum']; i++) {
        base_roll += skill['coinpwr'] + get_relevant(sinner, skill, "coinpwr", i)
        /*
        Damage Portion Blueprint:
        1. Skill damage, with on hit +X%, with effect bonuses like fragile, off buffs, and damage on-proc effects.
            These effects are flagged as "SKILL_".
        2. Proc damage, like rupture or talisman.
            These are just statuses that exist on the enemy.
        3. Application of effects, like applying fragile
            These effects are flagged as "APPLY_" for enemies, and "APPLYself_" for allies.
        */
        var physweakness = specified_target[skill['phystype']] + get_relevant(specified_target, skill, "phys", i)
        var sinweakness = specified_target[skill['sintype']] + get_relevant(specified_target, skill, "sin", i)
        var defenselevel = specified_target['dl'] + get_relevant(specified_target, skill, "defl", i)
        var offenselevel = skill['ol'] + sinner['lv'] + get_relevant(sinner, skill, "offl", i)
        var iscrit = crit
        var dynamic_bonus = dyn + get_relevant(specified_target, skill, "frag")/10 + get_relevant(sinner, skill, "damg", i)/10
        console.log(`Roll: ${base_roll}, Phys: x${physweakness}, Sin: x${sinweakness}, DL: ${defenselevel}, OL: ${offenselevel}, dyn: ${dynamic_bonus}`)

        var do_damage = calculate_standard(base_roll, physweakness, sinweakness, defenselevel, offenselevel, numclash, iscrit, obslvl, dynamic_bonus)

        var procdmg = procefct_on_enemy(specified_target)

        // TODO: Apply effects.
        apply_effects(specified_target, skill['coins'][i], "APPLY_")
        apply_effects(specified_target, sinner['inflict'], "APPLY_") // stuff like molar ish passive.
        apply_effects(sinner, skill['coins'][i], "APPLYself_")

        totdmg += do_damage
        totdmg += procdmg
        console.log(`Damage: ${do_damage}, Proc Damage: ${procdmg}, State: `, specified_target['state'])
        console.log(`sinner state: `, sinner['state'])
    }
    return [target, totdmg]
}

// todo: do sinner object implementation
sinner = {
    'name': 'Sinner name',
    'hp': 10,
    'lv': UNITLEVEL,
    'skill': ["WDon_S2", "WRyo_S2", "RHeath_S3_C"],
    'state': {},
    'inflict': {}
}

// todo: do timeline
//timeline = [(sinner, skill, state)]
// todo: evaluate timeline and give correct states to everyone.
//timeline = evaluate_timeline(timeline, skills)


// todo: make init sinners
target = init_target("Gossy")
target['part'][0]['state'] = {}
var [target, dmg] = hit_target_with_skill(sinner, 0, target)
console.log(`Total Damage: ${dmg}`)