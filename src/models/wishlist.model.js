import mongoose,{Schema} from "mongoose";

const wishlistSchema = new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
        unique:true
    },
    products:[
        {
            type:Schema.Types.ObjectId,
            ref:"Product",
            required:true
        }
    ]
},{timestamps:true})

wishlistSchema.index({user:1, products:1});
wishlistSchema.index({user:1});

export const Wishlist = mongoose.model("Wishlist",wishlistSchema)