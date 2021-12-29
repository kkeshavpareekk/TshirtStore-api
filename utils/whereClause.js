//base - Product.find()

// bigQ - /api/v1/product?search=coder&page=2&category=shortsleeves&rating[gte]=4
// &price[lte]=999&price[gte]=199
// basically req.query

class WhereClause {
  constructor(base, bigQ) {
    this.base = base;
    this.bigQ = bigQ;
  }

  search() {
    console.log(this.base)
    const searchword = this.bigQ.search
      ? {
          name: {
            $regex: this.bigQ.search,
            $options: "i",
          },
        }
      : {};

    this.base = this.base.find({ ...searchword });

    return this;
  }

  filter() {
    let copyQ = { ...this.bigQ };

    delete copyQ["search"];
    delete copyQ["limit"];
    delete copyQ["page"];

    let stringofcopyQ = JSON.stringify(copyQ);

    stringofcopyQ = stringofcopyQ.replace(
      /\b(gte|lte|gt|lt)\b/g,
      (m) => `$${m}`
    );

    const jsonofCopyQ = JSON.parse(stringofcopyQ);
     
    console.log(this.base)
    console.log(jsonofCopyQ);

    this.base = this.base.find(jsonofCopyQ);

    return this;
  }

  pager(resultperPage) {
    let currentPage = 1;

    if (this.bigQ.page) {
      currentPage = this.bigQ.page;
    }

    let pagesToSkip = resultperPage * (currentPage - 1);

    this.base = this.base.limit(resultperPage).skip(pagesToSkip);

    return this;
  }
}

module.exports = WhereClause;
