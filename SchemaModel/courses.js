const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userData',
  },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    videos: {
        type: Array,
        required: true
    },
    studentsEnrolled: {
      type: Array,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    category:{
      type: String,
      required: true,
    },
    price:{
      type: String,
      required: false,
    }, 
    Review:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:'Review'
      }
    ]

},
{
  timestamps: true, 
});

module.exports = mongoose.model('Course', courseSchema);
