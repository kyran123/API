//------------------------------------------------------------------//
// Import packages                                                  //
//------------------------------------------------------------------//
let express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../../Utility/Database.js');

//------------------------------------------------------------------//
// Import middlewares                                               //
//------------------------------------------------------------------//
const checkAuth = require('../../Middleware/check-auth.js');
const checkAdmin = require('../../Middleware/check-admin.js');


let lobbies = [];
let games = [];



//------------------------------------------------------------------//
// Handle get requests                                              //
//------------------------------------------------------------------//
router.get('/getRooms', checkAuth, (req, res) => {
    if(lobbies.length < 1) return res.json({ result: false, message: 'No rooms found' });
    res.json({ result: true, list: lobbies });
});


router.get('/leaderboard', checkAuth, (req, res) => {
    db.getLimited(['*'], 'minesweeper_scores', 100, 'score_time', (response) => {
        if(response.result) {
            return res.json({ result: true, data: response.data });
        } else {
            return res.json({ result: false, message: 'Unable to get leaderboard' });
        }
    });
});




//------------------------------------------------------------------//
// Handle POST requests                                             //
//------------------------------------------------------------------//
router.post('/score', checkAuth, (req, res) => {
    const user = req.body.user;
    if(user.id === null || user.id === undefined) return res.json({ result: false, message: 'No user id given' });
    db.get(['*'], 'minesweeper_scores', { score_player_id: user.id }, (response) => {
        if(response.result) {
            return res.json({ result: true, data: response.data[0] });
        } else {
            return res.json({ result: false, message: 'User has no score' });
        }
    });
});

// {
//     host: [username],
//     gameType: [int],
//     gameState: [int], (0 = lobby; 1 = Playing; 2 = Ended)
//     maxPlayers: [int],
//     players: [array],
//     board: [array],
//     description: [RTCpeerConnection description]
// }
router.post('/createRoom', checkAuth, (req, res) => {
    const room = req.body.room;
    let gotRoomId = true;
    let attempts = 0;
    while(gotRoomId) {
        attempts++;
        const newId = Math.floor(Math.random() * 10000) + 1;
        if(lobbies[newId] === null && games[newId] === null) {
            room.id = newId;
            gotRoomId = false;
        }
        if(attempts < 10000) {
            return res.json({ result: false, message: 'Failed to create room' });
        }
    }

    lobbies.push(room);
    console.log(room);
    res.json({ result: true });
});
// {
//    id: [int],
//    player: {
//       id: [username]#[userId],
//       name: [username]
//    } 
// }
router.post('/deleteRoom', checkAuth, (req, res) => {
    const roomId = req.body.id;
    const player = req.body.player;
    const room = lobbies[roomId];
    if(roomId == null || player == null) return res.json({ result: false, message: 'Missing data' }); 
    if(room === null || room === undefined) return res.json({ result: false, message: 'Room isn\'t in lobby list' }); 
    if(room.host === player.name) {
        lobbies.splice(roomId, 1);
    }
});
router.post('/joinRoom', checkAuth, (req, res) => {
    const roomId = req.body.id;
    if(lobbies[roomId] == null) return res.json({ result: false, message: 'Incorrect room id' });
    lobbies[roomId].players.push(req.body.player);
    res.json({ result: true, room: lobbies[roomId] });
});
router.post('/leaveRoom', checkAuth, (req, res) => {
    const roomId = req.body.id;
    const player = req.body.player;
    if(roomId == null && playerId == null) return res.json({ result: false, message: 'Missing data' }); 
    if(lobbies[roomId] != null) return res.json({ result: false, message: 'Room isn\'t in lobby list' }); 
    const room = lobbies[roomId];
    const playerIndex = room.players.indexOf(player);
    room.players.splice(playerIndex, 1);
    res.json({ result: true });
});
router.post('/startGame', checkAuth, (req, res) => {
    const roomId = req.body.id;  
    const player = req.body.player;
    if(roomId == null && playerId == null) return res.json({ result: false, message: 'Missing data' }); 
    if(lobbies[roomId] != null) return res.json({ result: false, message: 'Room isn\'t in lobby list' }); 
    if(lobbies[roomId].host === player.name) {
        lobbies[roomId].gameState = 1;
    }
    res.json({ result: true });
});



router.post('/add', checkAuth, (req, res) => {
    const score = req.body.score;
    const player = req.body.userId;
    const player_name = req.body.user;
    console.log('User:')
    console.log(req.body);
    db.get(['*'], 'minesweeper_scores', { score_player_id: player }, (response) => {
        let insertScore = {};
        
        console.log('Checking if score already in database')
        console.log(response);

        if(response.result) {
            //We can insert score now
            if(response.data[0].score_time > score || response.data[0].score_time === 0) {
                //We need to overwrite score to the new high score
                insertScore.score_time = score;
            }
            //Add the play to the totals
            console.log(response);
            insertScore.total_time = response.data[0].total_time + score;
            insertScore.total_plays = response.data[0].total_plays + 1;
            console.log(insertScore);
            db.update('minesweeper_scores', insertScore, { score_player_id: player }, (response) => {
                if(response.result) {
                    console.log('Score updated!');
                    return res.json({ result: true });
                } else {
                    console.log('Failed to update score');
                    console.log(result);
                    return res.json({ result: false });
                }
            });
        } else {
            insertScore.score_player_id = player;
            insertScore.score_player_name = player_name;
            //Add the play to the totals
            insertScore.score_time = score;
            insertScore.total_time = score;
            insertScore.total_plays = 1;
            console.log('Insert score')
            console.log(insertScore);
            //Need to create new row & then update score
            db.create('minesweeper_scores', insertScore, (respone) => {
                if(respone.result) {
                    console.log('New score added')
                    return res.json({ result: true });
                } else {
                    console.log('Failed to add new score')
                    return res.json({ result: false });
                }
            });
        }
    });
});




module.exports = router;