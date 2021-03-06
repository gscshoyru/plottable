///<reference path="testReference.ts" />

var assert = chai.assert;

describe("Scales", () => {
  it("Scale's copy() works correctly", () => {
    var testCallback: Plottable.IBroadcasterCallback = (broadcaster: Plottable.Broadcaster) => {
      return true; // doesn't do anything
    };
    var scale = new Plottable.Scale(d3.scale.linear());
    scale.registerListener(null, testCallback);
    var scaleCopy = scale.copy();
    assert.deepEqual(scale.domain(), scaleCopy.domain(), "Copied scale has the same domain as the original.");
    assert.deepEqual(scale.range(), scaleCopy.range(), "Copied scale has the same range as the original.");
    assert.notDeepEqual((<any> scale).listener2Callback, (<any> scaleCopy).listener2Callback,
                              "Registered callbacks are not copied over");
  });

  it("Scale alerts listeners when its domain is updated", () => {
    var scale = new Plottable.QuantitiveScale(d3.scale.linear());
    var callbackWasCalled = false;
    var testCallback: Plottable.IBroadcasterCallback = (broadcaster: Plottable.Broadcaster) => {
      assert.equal(broadcaster, scale, "Callback received the calling scale as the first argument");
      callbackWasCalled = true;
    };
    scale.registerListener(null, testCallback);
    scale.domain([0, 10]);
    assert.isTrue(callbackWasCalled, "The registered callback was called");

    scale.domain([0.08, 9.92]);
    callbackWasCalled = false;
    scale.nice();
    assert.isTrue(callbackWasCalled, "The registered callback was called when nice() is used to set the domain");

    callbackWasCalled = false;
    scale.padDomain(0.2);
    assert.isTrue(callbackWasCalled, "The registered callback was called when padDomain() is used to set the domain");
  });
  describe("autoranging behavior", () => {
    var data: any[];
    var dataSource: Plottable.DataSource;
    var scale: Plottable.LinearScale;
    beforeEach(() => {
      data = [{foo: 2, bar: 1}, {foo: 5, bar: -20}, {foo: 0, bar: 0}];
      dataSource = new Plottable.DataSource(data);
      scale = new Plottable.LinearScale();
    });

    it("scale autoDomain flag is not overwritten without explicitly setting the domain", () => {
      scale._addPerspective("1", dataSource, "foo");
      scale.autoDomain().padDomain().nice();
      assert.isTrue(scale._autoDomain, "the autoDomain flag is still set after autoranginging and padding and nice-ing");
      scale.domain([0, 5]);
      assert.isFalse(scale._autoDomain, "the autoDomain flag is false after domain explicitly set");
    });

    it("scale autorange works as expected with single dataSource", () => {
      scale._addPerspective("1x", dataSource, "foo");
      assert.deepEqual(scale.domain(), [0, 5], "scale domain was autoranged properly");
      data.push({foo: 100, bar: 200});
      dataSource.data(data);
      assert.deepEqual(scale.domain(), [0, 100], "scale domain was autoranged properly");
    });

    it("scale reference counting works as expected", () => {
      scale._addPerspective("1x", dataSource, "foo");
      scale._addPerspective("2x", dataSource, "foo");
      scale._removePerspective("1x");
      dataSource.data([{foo: 10}, {foo: 11}]);
      assert.deepEqual(scale.domain(), [10, 11], "scale was still listening to dataSource after one perspective deregistered");
      scale._removePerspective("2x");
      // "scale not listening to the dataSource after all perspectives removed"
      assert.throws(() => dataSource.deregisterListener(scale));
    });

    it("scale perspectives can be removed appropriately", () => {
      assert.isTrue(scale._autoDomain, "autoDomain enabled1");
      scale._addPerspective("1x", dataSource, "foo");
      scale._addPerspective("2x", dataSource, "bar");
      assert.isTrue(scale._autoDomain, "autoDomain enabled2");
      assert.deepEqual(scale.domain(), [-20, 5], "scale domain includes both perspectives");
      assert.isTrue(scale._autoDomain, "autoDomain enabled3");
      scale._removePerspective("1x");
      assert.isTrue(scale._autoDomain, "autoDomain enabled4");
      assert.deepEqual(scale.domain(), [-20, 1], "only the bar accessor is active");
      scale._addPerspective("2x", dataSource, "foo");
      assert.isTrue(scale._autoDomain, "autoDomain enabled5");
      assert.deepEqual(scale.domain(), [0, 5], "the bar accessor was overwritten");
    });
  });

  describe("Quantitive Scales", () => {
    it("autorange defaults to [0, 1] if no perspectives set", () => {
      var scale = new Plottable.LinearScale();
      scale.domain([]);
      scale.autoDomain();
      var d = scale.domain();
      assert.equal(d[0], 0);
      assert.equal(d[1], 1);
    });
  });

  describe("Ordinal Scales", () => {
    it("defaults to \"points\" range type", () => {
      var scale = new Plottable.OrdinalScale();
      assert.deepEqual(scale.rangeType(), "points");
    });

    it("rangeBand returns 0 when in \"points\" mode", () => {
      var scale = new Plottable.OrdinalScale();
      assert.deepEqual(scale.rangeType(), "points");
      assert.deepEqual(scale.rangeBand(), 0);
    });

    it("rangeBands are updated when we switch to \"bands\" mode", () => {
      var scale = new Plottable.OrdinalScale();
      scale.rangeType("bands");
      assert.deepEqual(scale.rangeType(), "bands");
      scale.range([0, 2679]);

      scale.domain([1,2,3,4]);
      assert.deepEqual(scale.rangeBand(), 399);

      scale.domain([1,2,3,4,5]);
      assert.deepEqual(scale.rangeBand(), 329);
    });
  });

  describe("Color Scales", () => {
    it("accepts categorical string types and ordinal domain", () => {
      var scale = new Plottable.ColorScale("10");
      scale.domain(["yes", "no", "maybe"]);
      assert.equal("#1f77b4", scale.scale("yes"));
      assert.equal("#ff7f0e", scale.scale("no"));
      assert.equal("#2ca02c", scale.scale("maybe"));
    });
  });

  describe("Interpolated Color Scales", () => {
    it("default scale uses reds and a linear scale type", () => {
      var scale = new Plottable.InterpolatedColorScale();
      scale.domain([0, 16]);
      assert.equal("#ffffff", scale.scale(0));
      assert.equal("#feb24c", scale.scale(8));
      assert.equal("#b10026", scale.scale(16));
    });

    it("linearly interpolates colors in L*a*b color space", () => {
      var scale = new Plottable.InterpolatedColorScale("reds");
      scale.domain([0, 1]);
      assert.equal("#b10026", scale.scale(1));
      assert.equal("#d9151f", scale.scale(0.9));
    });

    it("accepts array types with color hex values", () => {
      var scale = new Plottable.InterpolatedColorScale(["#000", "#FFF"]);
      scale.domain([0, 16]);
      assert.equal("#000000", scale.scale(0));
      assert.equal("#ffffff", scale.scale(16));
      assert.equal("#777777", scale.scale(8));
    });

    it("accepts array types with color names", () => {
      var scale = new Plottable.InterpolatedColorScale(["black", "white"]);
      scale.domain([0, 16]);
      assert.equal("#000000", scale.scale(0));
      assert.equal("#ffffff", scale.scale(16));
      assert.equal("#777777", scale.scale(8));
    });

    it("overflow scale values clamp to range", () => {
      var scale = new Plottable.InterpolatedColorScale(["black", "white"]);
      scale.domain([0, 16]);
      assert.equal("#000000", scale.scale(0));
      assert.equal("#ffffff", scale.scale(16));
      assert.equal("#000000", scale.scale(-100));
      assert.equal("#ffffff", scale.scale(100));
    });

    it("can be converted to a different range", () => {
      var scale = new Plottable.InterpolatedColorScale(["black", "white"]);
      scale.domain([0, 16]);
      assert.equal("#000000", scale.scale(0));
      assert.equal("#ffffff", scale.scale(16));
      scale.colorRange("reds");
      assert.equal("#b10026", scale.scale(16));
    });

    it("can be converted to a different scale type", () => {
      var scale = new Plottable.InterpolatedColorScale(["black", "white"]);
      scale.domain([0, 16]);
      assert.equal("#000000", scale.scale(0));
      assert.equal("#ffffff", scale.scale(16));
      assert.equal("#777777", scale.scale(8));

      scale.scaleType("log");
      assert.equal("#000000", scale.scale(0));
      assert.equal("#ffffff", scale.scale(16));
      assert.equal("#e3e3e3", scale.scale(8));
    });
  });

  describe("Ordinal Scales", () => {
    it("defaults to \"points\" range type", () => {
      var scale = new Plottable.OrdinalScale();
      assert.deepEqual(scale.rangeType(), "points");
    });

    it("rangeBand returns 0 when in \"points\" mode", () => {
      var scale = new Plottable.OrdinalScale();
      assert.deepEqual(scale.rangeType(), "points");
      assert.deepEqual(scale.rangeBand(), 0);
    });

    it("rangeBands are updated when we switch to \"bands\" mode", () => {
      var scale = new Plottable.OrdinalScale();
      scale.rangeType("bands");
      assert.deepEqual(scale.rangeType(), "bands");
      scale.range([0, 2679]);

      scale.domain([1,2,3,4]);
      assert.deepEqual(scale.rangeBand(), 399);

      scale.domain([1,2,3,4,5]);
      assert.deepEqual(scale.rangeBand(), 329);
    });
  });
});
