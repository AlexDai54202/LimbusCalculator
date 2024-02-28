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
    if (DEBUG) {
        console.log(`Base coin: ${base}`)
        console.log(`phys: +${convertedphys}, sin: +${convertedsin}, off/def: ${convertedatk}, clash: ${0.03 * numclash}, crit: ${convertedcrit}, obs: ${0.03 * obslvl}`)
        console.log(`static: ${(1 + convertedphys + convertedsin + convertedatk + 0.03 * numclash + convertedcrit + 0.03 * obslvl)}`)
        console.log(`dynamic: ${dyn + 1}`)
    }
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
    switch (newcondition) {
        case 'rupt':
        case 'sink':
        case 'trem':
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

function add_conditions(target, newconditions, sinner) {
    cur_conditions = target['state']
    for (var effect of Object.keys(newconditions)) {
        cur_conditions = add_condition(cur_conditions, effect, newconditions[effect])
    }
    for (var effect of Object.keys(sinner['inflict'])) {
        cur_conditions = add_condition(cur_conditions, effect, sinner['inflict'][effect])
    }
    return cur_conditions
}

function procefct_on_enemy(target) {
    state = target['state']
    var ret = 0
    // proc status first
    for (effect of Object.keys(state)) {
        switch (effect) {
            case 'rupt':
                target['hp'] -= state[effect]
                ret += state[effect]
                break
            case 'sink':
                target['hp'] -= state[effect] * target['gloom']
                ret += state[effect] * target['gloom']
                break
        }
    }
    // then decrement/increment status
    for (effect of Object.keys(state)) {
        switch (effect) {
            case 'count_rupt':
            case 'count_sink':
                state[effect] -= 1
                if (state[effect] <= 0) {
                    delete state[effect]
                    delete state[effect.slice(6)]
                }
                break
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
    var stage = 0
    var comparison_variable = tokens[1] // charge,rupture,etc.
    var comparison_type = tokens[2] // ge/le
    var comparison_value = parseInt(tokens[3]) // numeric
    if (comparison_type == 'ge') {
        return (target[comparison_variable] >= comparison_value)
    } else {
        return (target[comparison_variable] <= comparison_value)
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
    var tot_effect = 0
    statuses = target['status']
    for (effect in Object.keys(statuses)) {
        // this is unlikely to be used. perhaps BLSang passive?
        if ("if_" == effect.substring(0, 3)) {
            /* tokenize statuses */
            tokens = effect.split("_")
            if (parse_if_condition(target, tokens)) {
                effect = statuses[effect]
            }
        }
        if (target_effect in effect && !("NEXT_" in effect)) {
            tot_effect += statuses[effect]
        }
    }
    if (coin != -1) {
        // We assume that if coin != -1, then target = ally, not enemy.
        // skill part, ONLY search for "SKILL".
        skill_effects = skill['skillefct']
        for (effect in Object.keys(skill_effects)) {
            if ("SKILL_" == effect.substring(0, 6) && target_effect in effect) {
                tot_effect += skill_effects[effect]
            }
        }
        // coin part, only search for "SKILL"
        skill_effects = skill['coins'][i]
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
    apply_effects(sinner, skill, "ONUSE_self_") // TODO : Apply effects to sinner based on skill. return nothing. Specificially, with ONUSE_self_ flag.
    var base_roll = skill['basepwr'] + get_relevant(sinner, skill, "fpwr")
    var totdmg = 0;

    var specified_target = target["part"][partid]
    for (var i = 0; i < skill['coinnum']; i++) {
        base_roll += skill['coinpwr'] + get_relevant(sinner, skill, "coinpwr", i)
        /*
        Blueprint:
        1. Skill damage, with on hit +X%, with effect bonuses like fragile, off buffs, and damage on-proc effects.
            Figure out what my bonuses are.
        2. Proc damage, like rupture or talisman.
        3. Application of effects, like applying fragile
        */

        // todo: effect bonus
        // todo: power bonus

        // replace with calculate_damage, which figures out power and OL bonuses. Also does proceffects.
        var physweakness = specified_target[skill['phystype']]
        var sinweakness = specified_target[skill['sintype']]
        var defenselevel = specified_target['dl'] + get_relevant(specified_target, skill, "defl", i)
        var offenselevel = skill['ol'] + sinner['lv'] + get_relevant(sinner, skill, "offl", i)
        var iscrit = crit
        var dynamic_bonus = dyn + get_relevant(specified_target, skill, "frag") + get_relevant(sinner, skill, "damg", i)

        var do_damage = calculate_standard(base_roll, physweakness, sinweakness, defenselevel, offenselevel, numclash, iscrit, obslvl, dynamic_bonus)

        var procdmg = procefct_on_enemy(specified_target)

        // TODO: Apply effects.
        var [newstate, onhitdamage] = apply_effects(specified_target, skill['coins'][i], skill)
        specified_target['state'] = newstate

        totdmg += dmgthisturn
        totdmg += procdmg
        console.log(`Damage: ${dmgthisturn}, Proc Damage: ${procdmg}, State: `, specified_target['state'])
    }
    return [target, totdmg]
}

// todo: do sinner object implementation
sinner = {
    'name': 'Sinner name',
    'hp': 10,
    'lv': UNITLEVEL,
    'skill': ["name1", "name2", "RHeath_S3_C"],
    'state': {},
    'inflict': {}
}

// todo: do timeline
//timeline = [(sinner, skill, state)]
// todo: evaluate timeline and give correct states to everyone.
//timeline = evaluate_timeline(timeline, skills)


// todo: make init sinners
target = init_target("Gossy")
var [target, dmg] = hit_target_with_skill(sinner, 2, target)
console.log(`Total Damage: ${dmg}`)

//console.log(calculate_standard(25,2,1.5,5,0,0,false,0,0.3))