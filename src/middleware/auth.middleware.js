const jwt = require('jsonwebtoken');
const sessionModel = require('../module/session.module');

module.exports = async (req, res, next) => {
    try{
        const token = req.headers.authorization?.split(' ')[1];

        if(!token){
            return res.status(401).json({
                message: "You are not authenticated "
            })
        }

        const decoded = jwt.verify(token , process.env.JWT_SECRET);

        const session = await sessionModel.findOne({
            _id: decoded.session,
            revoked: false
        })

        if(!session){
            return res.status(401).json({
                message: "Invalid session: Session not found in database"
            });
        }

        req.user = decoded;

        next();

    }catch(err){
        res.status(401).json({message: 'Unauthorized', error: err.message });
    }
}