/*global describe: true, should: true, it: true, curl: true, Backbone: true */
(function () {
    "use strict";
    describe('Ebook.Toc.Item model', function () {
        describe('instance', function () {
            it('should be an instance of Backbone.Model', function (done) {
                curl(['model/ebook-toc-item'], function (EbookTocItemModel) {
                    var ebookTocItem = new EbookTocItemModel({ label: "test" });
                    ebookTocItem.should.be.an.instanceof(Backbone.Model);
                    done();
                });
            });

            it('should not be an endpoint if it has children', function (done) {
                curl(['model/ebook-toc-item'], function (EbookTocItemModel) {
                    // Given a toc item and a toc child item
                    var tocItem = new EbookTocItemModel({ label: "test" });
                    var tocChildItem = new EbookTocItemModel({ label: "childTest" });

                    // When we add a child item
                    tocItem.set('items', [ tocChildItem ]);

                    // It should not be an endpoint
                    tocItem.get('endPoint').should.be.false;
                    tocItem.get('items').should.have.length(1);

                    done();
                });
            });

            it('should be an endpoint if it has no child', function (done) {
                curl(['model/ebook-toc-item'], function (EbookTocItemModel) {
                    // Given a toc item
                    var tocItem = new EbookTocItemModel({ label: "test" });

                    // When... grmpf

                    // It should be an endpoint
                    tocItem.get('endPoint').should.be.true;

                    done();
                });
            });

            it('should get the position of a child', function (done) {
                curl(['model/ebook-toc-item'], function (EbookTocItemModel) {
                    // Given a toc item and 3 childs
                    var childItems = [], tocItem = new EbookTocItemModel({ label: "test" });
                    childItems.push(new EbookTocItemModel({ label: "child1", href: "child1.html", position: 1 }));
                    childItems.push(new EbookTocItemModel({ label: "child2", href: "child2.html", position: 2 }));
                    childItems.push(new EbookTocItemModel({ label: "child3", href: "child3.html", position: 3 }));
                    tocItem.set("items", childItems);

                    // When we search for child2.html href
                    var item = tocItem.getItem("child2.html");

                    // It should be an endpoint
                    item.get("position").should.be.equal(2);

                    done();
                });
            });
        });
    });
}());