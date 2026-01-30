import mongoose,{Schema} from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    password:{
        type:String,
        required:true,
        select:false
    },
    role:{
        type:String,
        enum:["user","admin"],
        default:"user"
    },
    phone:{
        type:String,
        required:true,
        match: [/^\+?[0-9]{10,14}$/, "Invalid phone number"]

    },
    address:[
    { 
        fullName:{
            type:String,
            required:true   
        },
        phone:{
            type:String,
            required:true,
            match: [/^\+?[0-9]{10,14}$/, "Invalid phone number"]   
        },
        street:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        state:{
            type:String,
            required:true
        },
        zipCode:{
            type:String,
            required:true
        },
        country:{
            type:String,
            required:true
        },
        isDefault:{
            type:Boolean,
            default:false   
        }
    }
    ],
    refreshToken:{
        type:String,
        select:false
    }
},{timestamps:true})

// userSchema.index({ email: 1 });

userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password,10);
    ;
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken =  function(){
    return jwt.sign(
        {
            _id:this._id,
            name:this.name,
            email:this.email,
            role:this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRES
        }
    )
}

userSchema.methods.generateRefreshToken =  function(){
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRES
        }
    )
}

export const User = mongoose.model("User",userSchema)