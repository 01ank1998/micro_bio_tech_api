const mongoose = require('mongoose');

module.exports.setup = function () {
  mongoose.Model.findById = async function (_id, lean = true) {
    let document = this.findOne({
      _id: mongoose.Types.ObjectId(_id),
    });

    if (lean) {
      return document.lean().exec();
    }

    return document.exec();
  };

  mongoose.Model.create = async function (document, fieldsToPopulate) {
    let model = new this(document);

    document = await model.save();

    return this.findById(document._id, fieldsToPopulate);
  };

  mongoose.Model.deleteById = async function (_id) {
    let document = await this.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId(_id),
      },
      {
        deleted: true,
      },
      {
        new: true,
      }
    );

    return document.deleted === true;
  };

  mongoose.Model.updateById = async function (
    _id,
    updatedDocument,
    fieldsToPopulate,
    runValidators = true
  ) {
    await this.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId(_id),
      },
      updatedDocument,
      {
        new: true,
        runValidators,
      }
    );

    return this.findById(_id, fieldsToPopulate);
  };
};
