import mongoose,{Schema} from "mongoose";
import mongooseaggregatePaginate from "mongoose-aggregate-paginate-v2";

const productSchema = new Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    slug:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    brand:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    category:{
        type:Schema.Types.ObjectId,
        ref:"Category",
        required:true,
    },
    basePrice:{
        type:Number,
        required:true,
    },
    discountedPrice:{
        type:Number,
        default:null
    },
    images:{
        type:[String],
        required:true,
    },
    isFeatured:{
        type:Boolean,
        default:false
    },
    isNewArrival:{
        type:Boolean,
        default:false
    },
    ingredients:[{
        type:String,
        
    }],
    howToUse:{
        type:String
    },
    skinType:[
        {
            type:String,
            enum: ["dry", "oily", "combination", "sensitive"]
        }
    ],
    ratingsAverage:{
        type:Number,
        default:0
    },
    ratingsCount:{
        type:Number,
        default:0
    }
},{timestamps:true})

// productSchema.index({slug:1})
productSchema.index({category:1})
productSchema.index({isFeatured:1})
productSchema.index({isNewArrival:1})

productSchema.plugin(mongooseaggregatePaginate);

productSchema.pre('save', async function(next){
    if(!this.isModified('name')) return next();
    const baseSlug = this.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g,'')
    .replace(/\s+/g,'-');

    let slug = baseSlug;
    let count =0;
    while(await mongoose.models.Product.findOne({slug,_id:{$ne:this._id}})){
        count++;
        slug = `${baseSlug}-${count}`;
    }
    this.slug = slug;
    next();
})

export const Product = mongoose.model("Product",productSchema)