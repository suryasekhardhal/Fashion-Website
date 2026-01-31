import mongoose,{Schema} from "mongoose";

const categorySchema = new Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    slug:{
        type:String,
        unique:true
    },
    description:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    isActive:{
        type:Boolean,
        default:true
    }

},{timestamps:true})

// categorySchema.index({slug:1})

categorySchema.pre('save', async function(next){
    if (!this.isModified('name')) return;
    const baseSlug = this.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');

    let slug = baseSlug;
    let count = 0;

    while(await mongoose.models.Category.findOne({slug, _id:{$ne: this._id}})){
        count++;
        slug = `${baseSlug}-${count}`;
    }

    this.slug = slug;

    // next();
})
export const Category = mongoose.model("Category",categorySchema)