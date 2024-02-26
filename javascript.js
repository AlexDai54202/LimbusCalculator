DEBUG = true


function readTextFile(file) {
    return fetch(file).then(data => data.json())
}

SKILLS = readTextFile()
ENEMIES = readTextFile()


function calculate_standard(base, weakphys, weaksin, enemydef, allyatk, numclash, crit, obslvl, dyn){
    let convertedphys = ((weakphys-1)>0 ? (weakphys-1) : (weakphys-1)/2)
    let convertedsin = ((weaksin-1)>0 ? (weaksin-1) : (weaksin-1)/2)
    let convertedatk = (allyatk - enemydef)/(Math.abs(allyatk-enemydef)+25)
    let convertedcrit = (crit ? .2 : 0)
    if (DEBUG) {
        console.log(`Base coin: ${base}`)
        console.log(`phys: +${convertedphys}, sin: +${convertedsin}, off/def: ${convertedatk}, clash: ${0.03*numclash}, crit: ${convertedcrit}, obs: ${0.03*obslvl}`)
        console.log(`static: ${(1 + convertedphys + convertedsin + convertedatk + 0.03*numclash + convertedcrit + 0.03*obslvl)}`)
        console.log(`dynamic: ${dyn+1}`)
    }
    return base * (1 + convertedphys + convertedsin + convertedatk + 0.03*numclash + convertedcrit + 0.03*obslvl) * (dyn+1)
}


function hit_skill_on_target(skillname, targetname) {
    
}
//console.log(calculate_standard(25,2,1.5,5,0,0,false,0,0.3))