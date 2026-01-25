import mongoose,{Schema} from "mongoose";

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
    ]
},{timestamps:true})

userSchema.index({ email: 1 });

export const User = mongoose.model("User",userSchema)