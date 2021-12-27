import './typedefs.js';
import fs from 'fs-extra';
import { convertToDIM } from './convert_to_dim.js';

/**
 * 
 * @param {string} curator 
 * @returns {Promise<CuratorInfo>}
 */
async function loadCuratorInfo(curatorName) {
    const buffer = await fs.readFile(`./littlelight_wishlists/curators/${curatorName}/index.json`);
    let string = buffer.toString();
    let curatorInfo = JSON.parse(string);
    return curatorInfo;
}

/**
 * @param {string} path
 * @returns {Promise<Wishlist>}
 */
async function loadWishlist(path) {
    const buffer = await fs.readFile(`./littlelight_wishlists/${path}`);
    let string = buffer.toString();
    let wishlist = JSON.parse(string);
    return wishlist;
}

/**
 * @param {string} path
 * @param {any} data
 * @returns {Promise<void>}
 */
async function saveJSONData(path, data) {
    await fs.createFile(`./${path}`);
    await fs.writeJSON(`./${path}`, data);
}

/**
 * @param {string} path
 * @param {string} data
 * @returns {Promise<void>}
 */
 async function saveDIMWishlist(path, data) {
    let txtPath = path.replace('.json', '.txt');
    await fs.createFile(`./${txtPath}`);
    await fs.writeFile(`./${txtPath}`, data);
}

/**
 * @param {string} name
 * @param {string} description
 * @returns {Wishlist}
 */
function createWishlist(name, description) {
    let wishlist = {
        name,
        description,
        data: []
    };
    return wishlist;
}

/**
 * @param {Wishlist} wishlist
 * @returns {Promise<Wishlist>}
 */
function getStrictWishlist(wishlist){
    let builds = wishlist.data.filter((b)=>b.plugs.length > 2);
    let strictWishlist = {
        ...wishlist,
        data:builds
    };
    return strictWishlist;
}


/**
 * @param {CuratorInfo} curator
 * @returns {Promise<void>}
 */
async function buildCuratorBundles(curator) {
    let bundles = curator.bundles.filter((b)=>!b.hidden);
    for (let bundle of bundles) {
        const wishlist = await buildBundle(bundle, curator);
        await saveJSONData(`bundles/littlelight/${bundle.output}`, wishlist);
        const strictWishlist = getStrictWishlist(wishlist);
        await saveJSONData(`bundles/littlelight-strict/${bundle.output}`, strictWishlist);
        const DIMWishlist = convertToDIM(wishlist);
        await saveDIMWishlist(`bundles/DIM/${bundle.output}`, DIMWishlist);
        const DIMStrictWishlist = convertToDIM(strictWishlist);
        await saveDIMWishlist(`bundles/DIM-strict/${bundle.output}`, DIMStrictWishlist);

    }
}

/**
 * @param {CuratorInfo} curator
 */
async function buildCuratorPartials(curator) {
    /** @type Set<string> */
    let files = new Set();
    let bundles = curator.bundles.filter((b)=>!b.hidden);
    for (let bundle of bundles) {
        bundle.files.forEach(files.add, files);
    }
    for (let file of files) {
        let wishlist = await loadWishlist(file);
        let path = file.split('/');
        let fileName = path[path.length - 1];
        let partialFileName = `partials/littlelight/${fileName}`;
        await saveJSONData(partialFileName, wishlist);
        const strictWishlist = getStrictWishlist(wishlist);
        await saveJSONData(`partials/littlelight-strict/${fileName}`, strictWishlist);
        const DIMWishlist = convertToDIM(wishlist);
        await saveDIMWishlist(`partials/DIM/${fileName}`, DIMWishlist);
        const DIMStrictWishlist = convertToDIM(strictWishlist);
        await saveDIMWishlist(`partials/DIM-strict/${fileName}`, DIMStrictWishlist);
    }
}

/**
 * @param {BundleInfo} bundle
 * @param {CuratorInfo} curator
 * @returns {Promise<Wishlist>}
 */
async function buildBundle(bundle, curator) {
    let wishlist = createWishlist(bundle.name || curator.name, bundle.description || curator.description);
    for (let file of bundle.files) {
        let wishlistFile = await loadWishlist(file);
        let originalName = file.replace('littlelight_wishlists/curators/', '').replace('.json', '');
        for (let build of wishlistFile.data) {
            /** @type {WishlistItem} **/
            let bundleBuild = {
                ...build,
                originalWishlist: originalName
            };
            wishlist.data.push(bundleBuild);
        }
    }
    return wishlist;
}

async function run() {
    
    const curatorParam = process.argv[2];
    if(curatorParam == null){
        var partialsExists = await fs.pathExists("./bundles");
        if(partialsExists){
            await fs.rm('./bundles', {recursive:true});    
        }
        var partialsExists = await fs.pathExists("./partials");
        if(partialsExists){
            await fs.rm('./partials', {recursive:true});
        }
    }
    const curator = await loadCuratorInfo('just-another-team');
    await buildCuratorBundles(curator);
    await buildCuratorPartials(curator);
    
}

run();