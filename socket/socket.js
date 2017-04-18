module.exports = function(io, rooms){
    var chatrooms = io.of('/roomlist').on('connection', function(socket){
        console.log('Established on the server');        
        socket.emit('roomupdate', JSON.stringify(rooms));
        
        socket.on('newroom', function(data){
            rooms.push(data);
            socket.broadcast.emit('roomupdate', JSON.stringify(rooms));
            socket.emit('roomupdate', JSON.stringify(rooms));
        });
    });

    var messages = io.of('/messages').on('connection', function(socket){
        console.log('Connected to chatroom');    

        socket.on('joinroom', function(data){
            socket.username = data.user;
            socket.userPic = data.userPic;
            socket.join(data.room);
            updateUserList(data.room, true);
        });
        
        socket.on('newMessage', function(data){
            socket.broadcast.to(data.room_number).emit('messagefeed', JSON.stringify(data)); 
        });
        
        function updateUserList(room, updateAll){

            io.of('/messages').in(room).clients(function(err, client){
                var userlist = [];

                for(var i = 0; i < client.length; i++){
                 userlist.push({user:io.of('/messages').in(room).connected[client[i]].username,
                     userPic:io.of('/messages').in(room).connected[client[i]].userPic});
                }

                socket.emit('updateUsersList', JSON.stringify(userlist));
                if(updateAll){
                    socket.broadcast.to(room).emit('updateUsersList', JSON.stringify(userlist));
                }
            });
        }
        socket.on('updateList', function(data){
            updateUserList(data.room);
        });
    });
}