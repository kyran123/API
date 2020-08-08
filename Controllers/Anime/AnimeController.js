//------------------------------------------------------------------//
// Import packages                                                  //
//------------------------------------------------------------------//
/*const anilist = require('anilist-node');
const Anilist = new anilist();
const malScraper = require('mal-scraper');
const {si} = require('nyaapi');*/


//------------------------------------------------------------------//
// Import utility classes                                           //
//------------------------------------------------------------------//
const db = require('../../Utility/Database.js');



class AnimeController {
    //------------------------------------------------------------------//
    // Single anime requests                                            //
    //------------------------------------------------------------------//
    getAnime() {
        //TODO:
        //Check if anime already in database
        //If not, get it from anilist
        //Get torrents

    }
}

module.exports = new AnimeController();