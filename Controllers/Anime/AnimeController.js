//------------------------------------------------------------------//
// Import packages                                                  //
//------------------------------------------------------------------//
const anilist = require('anilist-node');
const Anilist = new anilist();
const moment = require('moment');


//------------------------------------------------------------------//
// Import utility classes                                           //
//------------------------------------------------------------------//
const db = require('../../Utility/Database.js');



class AnimeController {
    //------------------------------------------------------------------//
    // MAL & Anilist requests                                           //
    //------------------------------------------------------------------//
    getAnilistData(id, callback) {
        Anilist.media.anime(parseInt(id))
        .then((animeData) => {
            if(animeData.status !== null) {
                animeController.addAnimeToDB(animeData, (result, data) => {
                    if(!result) {
                        callback({ result: false });
                    } else {
                        callback({ result: true, data: data });
                    }
                });
            } else {
                callback({ result: false });
            }
        })
        .catch((err) => {
            console.log('[GetAnilistData] Error: ' + err);
            callback({ result: false });
        });
    }

    //------------------------------------------------------------------//
    // Single anime requests                                            //
    //------------------------------------------------------------------//
    async getAnimeById(req, res, next) {
        console.log("Getting anime by id");
        const animeId = req.params.id;
        
        //Check if anime is already saved in database
        const inDB = await animeController.checkIfAnimeIsInDB({ id: animeId });
        //send the data
        if(inDB.hasOwnProperty('data') && inDB.data.length > 0) {
            //Check if data is up to date
            if(!animeController.isUpToDate(inDB.data[0].entry_created)) {
                //TODO: update data
            }

            if(inDB.data[0].relations != null && inDB.data[0].relations.length > 0) {
                const relationData = await animeController.getRelationsData(inDB.data[0].relations.split(","));
                inDB.data[0].relations_data = relationData;
                return res.json({ result: true, data: inDB.data[0] });
            } else {
                return res.json({ result: true, data: inDB.data[0] });
            }
        }

        //Is not in database, so get it from AniList and update the database
        Anilist.media.anime(parseInt(req.params.id))
        .then((animeData) => {
            animeController.addAnimeToDB(animeData, async (result, data) => {
                if(!result) {
                    res.json({ result: false });
                } else {
                    if(data.relations != null && data.relations.length > 0) {
                        const relationData = await animeController.getRelationsData(data.relations.split(","));
                        data.relations_data = relationData.data;
                        return res.json({ result: true, data: data });
                    } else {
                        return res.json({ result: true, data: data });
                    }
                }
            });
        })
        .catch((err) => {
            console.log(err);
            res.json({ result: false, message: 'Anime not found' });
        });
    }
    getRelationsData(idList) {
        return new Promise(async (resolve, reject) => {
            //Get relations data
            let relationData = [];
            idList.forEach(async (relation, index) => {
                //Check for each relation if it is in DB
                const inDB = await animeController.checkIfAnimeIsInDB({ id: parseInt(relation) });
                if(inDB.hasOwnProperty('data') && inDB.data.length > 0) {
                    relationData.push(inDB.data[0]);
                }
                else { //Else get it from the anilist api
                    animeController.getAnilistData(relation, (response) => {
                        if(response.result !== false) {
                            relationData.push(response.data);
                        }
                    });
                }
                //Once looped through all relations resolve promise
                if(index >= idList.length-1) resolve(relationData);
            });
        });
    }
    getAnimeUserData(req, res, next) {
        const anime = req.body.anime;
        const user = req.body.user;
        //check if anime object has at least an anime id and user id
        if(anime.id !== null || user.id !== null) return res.json({ result: false, message: 'Missing anime or user Id' });
        animeController.checkIfAnimeIsAddedByUser({ anime_id: anime.id, user_id: user.id })
        .then((result) => {
            if(response.result) {
                return res.json({ result: true, data: response });
            } else {
                return res.json({ result: false });
            }
        })
        .catch(err => console.log);
    }
    //------------------------------------------------------------------//
    // Searching anime                                                  //
    //------------------------------------------------------------------//
    SearchAnime(req, res, next) { 
        Anilist.search('anime', req.params.name, 1, 10)
        .then((response) => {
            console.log(response);
            let results = [];
            response.media.forEach(async (anime, index) => {
                
                const inDB = await animeController.checkIfAnimeIsInDB({ id: parseInt(anime.id) });
                if(inDB.hasOwnProperty('data') && inDB.data.length > 0) {
                    results.push(inDB.data[0]);
                } else {
                    results.push({
                        id: anime.id,
                        name_pref: anime.title.userPreferred,
                        name_en: anime.title.english,
                        name_rom: anime.title.romaji
                    });
                }
                if(index >= response.media.length-1) res.json({ result: true, data: results });
            });
        })
        .catch((err) => {
            console.error(err);
            res.json({ result: false, message: 'Failed to search on term' });
        });
    }
    //------------------------------------------------------------------//
    // Database functions                                               //
    //------------------------------------------------------------------//
    checkIfAnimeIsInDB(value) {
        return new Promise((resolve, reject) => {
            db.get(['*'], 'anime', value, (response) => {
                if(response.result) {
                    resolve(response);
                } else {
                    resolve(response);
                }
            });
        });
    }
    checkIfAnimeIsAddedByUser(value) {
        return new Promise((resolve, reject) => {
            db.get(['*'], 'anime_user_status', value, (response) => {
                if(response.result) {
                    resolve(response);
                } else {
                    resolve(response);
                }
            });
        });
    }
    //{showContactDetails ? Customer : ''}
    addAnimeToUser(req, res, next) {
        console.log('adding anime to user list');
        console.log(req.body);
        const anime = req.body.anime;
        const user = req.body.user;
        //check if anime object has at least an anime id and user id
        if(anime.id !== null || user.id !== null) return res.json({ result: false, message: 'Missing anime or user Id' });
        let animeStatus = {
            anime_id: anime.id,
            user_id: user.id,
            anime_status: 0,
            download_status: 0
        }        
        db.create('anime_user_status', animeStatus, (response) => {
            if(response.result) {
                return res.json({ result: true, data: animeStatus });
            } else {
                console.log(`[AddAnimeToDB] on insert anime_user_status to DB: ${response.err}`);
                return res.json({ result: false });
            }
        });
    }
    addAnimeToDB(animeData, callback) {
        if(animeData.data == null){
            if(animeData.id == null) return callback(false, []);
        } 

        //Get alternative names (synonyms) of the anime
        let altNames = '';
        if(animeData.synonyms != null) {
            animeData.synonyms.forEach((synonym, index) => {
                altNames += synonym;
                if(index < animeData.synonyms.length-1) {
                    altNames += ',';
                }
            });
        }
        //Get the relation ids of the anime
        let relationIds = '';
        if(animeData.relations != null) {
            animeData.relations.forEach((relation, index) => {
                relationIds += relation.id;
                if(index < animeData.relations.length-1) {
                    relationIds += ',';
                }
            });
        }
        //Get the names of all studios worked on this anime
        let studioNames = '';
        if(animeData.studios != null) {
            animeData.studios.forEach((studio, index) => {
                studioNames += studio.name;
                if(index < animeData.studios.length-1) {
                    studioNames += ',';
                }
            });
        }
        //Get the genres of the anime
        let genreNames = '';
        if(animeData.genres != null) {
            animeData.genres.forEach((genre, index) => {
                genreNames += genre;
                if(index < animeData.genres.length-1) {
                    genreNames += ',';
                }
            });
        }
        //Get the tags of the anime
        let tagNames = '';
        if(animeData.tags != null) {
            animeData.tags.forEach((tag, index) => {
                tagNames += tag.name;
                if(index < animeData.tags.length-1) {
                    tagNames += ',';
                }
            });
        }
        //Get external links
        let extLinks = '';
        if(animeData.externalLinks != null) {
            animeData.externalLinks.forEach((extLink, index) => {
                extLinks += extLink;
                if(index < animeData.externalLinks.length-1) {
                    extLinks += ',';
                }
            });
        }

        /*console.log(db.connection.format('INSERT INTO ?? SET ?', ['anime', {
            id: animeData.id
        }]));*/


        let handledData = {
            id: animeData.id,
            id_mal: animeData.idMal,
            name_pref: JSON.parse( JSON.stringify( animeData.title.userPreferred ) ),
            name_eng: JSON.parse( JSON.stringify( animeData.title.english ) ),
            name_rom: JSON.parse( JSON.stringify( animeData.title.romaji ) ),
            name_alt: JSON.parse( JSON.stringify( altNames ) ),
            description: JSON.parse( JSON.stringify( animeData.description ) ),
            genres: genreNames,
            tags: tagNames,
            img: animeData.coverImage.medium,
            img_large: animeData.coverImage.large,
            status: animeData.status,
            rating: animeData.averageScore,
            relations: relationIds,
            episodes: animeData.episodes,
            episode_duration: animeData.duration,
            release_year: animeData.seasonYear,
            release_season: animeData.season,
            studios: studioNames,
            ext_links: extLinks,
            entry_created: moment().format()
        };

        db.create('anime', handledData, (response) => {
            if(response.result) {
                callback(true, handledData);
            } else {
                console.log(`[AddAnimeToDB] on insert anime to DB: ${response.err}`);
                callback(false, handledData);
            }
        });
    }
    //------------------------------------------------------------------//
    // Other functions                                                  //
    //------------------------------------------------------------------//
    isUpToDate(date) {
        let nextUpdateTime = moment(date).add(500, 'days');
        if(moment().isAfter(nextUpdateTime)) {
            return true;
        }
        return false;
    }
}

const animeController = new AnimeController();

module.exports = animeController;