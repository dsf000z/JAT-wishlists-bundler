import './typedefs.js';

/**
 * @param {number[][]} entries
 * @returns {number[][]}
 */
function cartesianProduct(entries) {
    return entries
        .filter((e) => e.length > 0)
        .reduce(
            (results, entries) =>
                results
                    .map(result => entries.map(entry => result.concat([entry])))
                    .reduce((subResults, result) => subResults.concat(result), []),
            [[]],
        )
}

/**
 * @param {string[]} tags
 * @returns {string[]}
 */
function convertTagsToDIM(tags){
    return tags.map((t)=>{
        let tag = t.toLowerCase();
        if(tag == 'godpvp') return 'god-pvp';
        if(tag == 'godpve') return 'god-pve';
        return tag;
    });
}

function createDIMBuild(build){
    let lines = "";
    if (build.description || build.tags?.length) {

        lines += `//notes:`;
        if(build.description){
            let description = build.description.replace('\n', '');
            lines+= ` ${description}`;
        }
        if (build.tags?.length && lines.indexOf('tags:') < 0) {
            lines += ` tags:${convertTagsToDIM(build.tags).join(',')}`;
        }
        lines += "\n";
    }

    let permutations = cartesianProduct(build.plugs);
    for (var l in permutations) {
        let line = permutations[l];
        lines += `dimwishlist:item=${build.hash}&perks=${line.join(',')}\n`;
    }
    return `${lines}\n`;
}

/**
 * @param {Wishlist} wishlist
 * @returns {string}
 */
export function convertToDIM(wishlist) {
    let result = "";
    if (wishlist.name)
        result += `title:${wishlist.name}\n`;
    if (wishlist.description)
        result += `description:${wishlist.description}\n`;

    if (result.length > 0)
        result += '\n';

    let builds = [...wishlist.data].sort(
        (a, b) => {
            let aHash = a.hash || 0;
            let bHash = b.hash || 0;
            let hashResult = aHash - bHash;
            if (hashResult !== 0) return hashResult;
            let aGodRollCount = a.tags?.filter((t) => ["GodPVP", "GodPVE"].indexOf(t) > -1)?.length || 0;
            let bGodRollCount = b.tags?.filter((t) => ["GodPVP", "GodPVE"].indexOf(t) > -1)?.length || 0;
            return bGodRollCount - aGodRollCount;
        });

    for(let build of builds){
        result += createDIMBuild(build);
    }
    return result;
}