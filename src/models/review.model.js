import mongoose,{Schema} from "mongoose";

const reviewSchema = new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    product:{
        type:Schema.Types.ObjectId,
        ref:"Product",
        required:true
    },
    rating:{
        type:Number,
        required:true,
        min:1,
        max:5
    },
    comment:{
        type:String,
        maxlength:1000
    }
},{timestamps:true})

reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ product: 1 });

reviewSchema.statics.calculateAverageRating = async function(productId){
    const result = await this.aggregate([
        {
            $match:{
                product:productId
            }
        },
        {
            $group:{
                _id:"$product",
                ratingsCount:{ $sum: 1 },
                ratingsAverage:{$avg:"$rating"}
            }
        }
    ])

    if(result.length > 0){
        await mongoose.model("Product").findByIdAndUpdate(productId, {
        ratingsCount: result[0].ratingsCount,
        ratingsAverage: Math.round(result[0].ratingsAverage * 10) / 10
});

    } else {
        await mongoose.model("Product").findByIdAndUpdate(productId,{
            ratingsAverage:0,
            ratingsCount:0
        })
    }
}

reviewSchema.post('save',async function(){
    await this.constructor.calculateAverageRating(this.product)
})

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.review = await this.model.findOne(this.getQuery());
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  if (this.review) {
    await this.review.constructor.calculateAverageRating(this.review.product);
  }
});


export const Review = mongoose.model("Review",reviewSchema)