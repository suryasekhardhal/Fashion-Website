import mongoose,{Schema} from "mongoose";

const cartSchema = new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
        unique:true
    },
    items:[
        {
            product:{
                type:Schema.Types.ObjectId,
                ref:"Product",
                required:true
            },
            shade:{
                type:Schema.Types.ObjectId,
                ref:"Shade",
                required:true
            },
            quantity:{
                type:Number,
                required:true,
                min:1
            },
            price:{
                type:Number,
                required:true
            }
        }
    ],
    totalPrice:{
        type:Number,
        default:0
    }
},{timestamps:true})

cartSchema.index(
  { user: 1, "items.product": 1, "items.shade": 1 }
);
cartSchema.index({ user: 1 });


export const Cart = mongoose.model("Cart",cartSchema)