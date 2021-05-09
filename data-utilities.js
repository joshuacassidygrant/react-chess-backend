exports.validateReqRoom = (req, rooms, loc, create) => {
    const room = req.room;
    if (!room) return null;
    if (!(room in rooms)) {
        if (create) {
            rooms[room] = {name: room, users:[], history:[]}
            return room;
        } else {
            console.warn(`No room found with id ${room} in ${loc}`);
            return null;
        }
    } else {
        return room;
    }
}

exports.validateUserId = (req, users, loc) => {
    const uid = req.uid;
    if (!uid) return null;
    if (!(uid in users)) {
        console.warn(`No user found with id ${uid} in ${loc}`);
        console.log(users);
        return null;
    } else {
        return uid;
    }
}