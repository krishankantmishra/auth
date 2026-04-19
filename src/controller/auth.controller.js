const userModel = require('../module/user.module');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.signup = async (req, res)=>{
    
    try{

        const {username, email, password} = req.body;

        const userExists = await userModel.findOne({
            $or:[
                {username},
                {email}
            ]
        })

        if(userExists){
            return res.status(400).json({
                message:"user already exists"
            })
        }

        const hash = await crypto.createHash('sha256').update(password).digest('hex');

        const user = new userModel({username, email, password: hash})
        await user.save()

        const accessToken = jwt.sign({
            id:user._id
        },process.env.JWT_SECRET,{
            expiresIn: '15m'
        })
    
        const refreshToken = jwt.sign({
            id: user._id
        },process.env.JWT_SECRET,{
            expiresIn: "7d"
        })

        res.cookie('refreshToken', refreshToken,{
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })

        res.status(201).json({ 
            message: 'User created successfully',
            user:{
                id: user._id,
                username,
                email
            },
            accessToken: accessToken,
         });

    }catch(err){
        res.status(500).json({message: 'Internal Server Error', error: err.message });
    }
}

exports.logIn = async (req, res) =>{
   try{

    const {email, password} = req.body;

    const user = await userModel.findOne({email});

    if(!user){
        return res.status(400).json({
            message: "Invalid email"
        })
    }

    const isPasswordMatched = await crypto.createHash('sha256').update(password).digest('hex') === user.password;

    if(!isPasswordMatched){
        return res.status(400).json({
            message: "Invalid password"
        })
    }

    const accessToken = jwt.sign({
        id: user._id
    },process.env.JWT_SECRET,{
        expiresIn: '15m'
    })

    const refreshToken = jwt.sign({
        id: user._id
    },process.env.JWT_SECRET,{
        expiresIn: "7d"
    })

    res.cookie('refreshToken', refreshToken,{
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.status(200).json({
        message: 'Logged in successfully',
        accessToken
    })    

   }catch(err){
        res.status(500).json({message: 'Internal Server Error', error: err.message });
   }
}

exports.profile = async (req, res) =>{
    try{
        const user = await userModel.findById(req.user.id)

        if(!user){
            return res.status(404).json({
                message: "User not found"
            })
        }

        res.status(200).json({
            id: user._id,
            username: user.username,
            email: user.email
        })

    }catch(err){
        res.status(500).json({message: 'Internal Server Error', error: err.message });
    }
}

exports.refreshToken = async (req, res) =>{
    const token = req.cookies.refreshToken

    if(!token){
        return res.status(401).json({
            message: "You are not authenticated"
        })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const newAccessToken = jwt.sign({
        id: decoded.id
    },process.env.JWT_SECRET,{
        expiresIn: "15m"
    })

    const newRefreshToken = jwt.sign({
        id: decoded.id
    },process.env.JWT_SECRET,{
        expiresIn:"7d"
    })

    res.cookie('refreshToken', newRefreshToken,{
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.status(200).json({
            accessToken: newAccessToken
    })

}