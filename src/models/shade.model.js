import mongoose,{Schema} from "mongoose";

const shadeSchema = new Schema({
    product:{
        type:Schema.Types.ObjectId,
        ref:"Product",
        required:true,
    },
    shadeName:{
        type:String,
        required:true,
        trim:true
    },
    shadeCode:{
        type:String,
        required:true,
        match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    },
    shadeImage:{
        type:String,
        required:true,
    },
    stock:{
        type:Number,
        required:true,
        min:0
    },
    price:{
        type:Number,
        default:null,
    },
    isActive:{
        type:Boolean,
        default:true
    }   
},{timestamps:true})

shadeSchema.index({ product: 1, shadeName: 1 }, { unique: true });
shadeSchema.index({ product: 1 });


export const Shade = mongoose.model("Shade",shadeSchema)