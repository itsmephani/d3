// d3 scale type.
const scalePoint = 'scalePoint';

const COLORS = d3.scaleOrdinal(d3.schemeCategory10);
const X = 0;
const Y1 = 1;
const Y2 = 2;
const TOP_LEFT = 0;
const BOTTOM_RIGHT = 1;

const rectContains = (rect, point) => {
  console.log(rect, point);
  return rect[TOP_LEFT][X] <= point[X] && point[X] <= rect[BOTTOM_RIGHT][X]
         && (rect[TOP_LEFT][Y1] <= point[Y1] && point[Y1] <= rect[BOTTOM_RIGHT][Y1]
         ||  rect[TOP_LEFT][Y1] <= point[Y2] && point[Y2] <= rect[BOTTOM_RIGHT][Y1]);
};

class MultiLineChart {
 
  constructor(config) {
    this.config = config;
    this.line = null;
    this.svg = null;
    this.tooltipContainer = null;
    this.xScale = null;
    this.yScale = null;
    this.xAxisData = [];
    this.yAxisData = [];
    this.previousData = [];

    this.width = this.config.width || 500;
    this.height = this.config.height || 400;

    this.brush = {};

    setTimeout( _ => { 
      this.drawChart();
    }, 0);
  }

  drawChart() {
    this.initSvg();
    this.initAxis();       
    this.drawAxis();
    this.drawGrid();
    this.drawBrush();
    this.drawMultiLineChart();
    this.drawLegend();
  }

  clearChart() {
    if (this.svg) {
      this.svg.remove();
    }
  }

  initSvg() {
    const tooltipElement = document.createElement('div');
    tooltipElement.setAttribute('class', 'multi-line-chart__tooltip');
    document.querySelector('body').insertBefore(tooltipElement, null);
    this.tooltipContainer = d3.select(tooltipElement);

    this.svg = d3.select(this.config.element)
        .attr('width', this.width)
        .attr('height', this.height)
        .append('g')
        .attr('transform', 'translate(' + this.config.margin.left + ',' + this.config.margin.top + ')');
  }

  initAxis() {
    this.xAxisData = this.config.data.map( (d) => d[0][this.config.xProp] );
    if (!this.config.xScale || this.config.xScale === scalePoint) {
      this.xScale = d3.scalePoint().range([0, this.width - this.config.margin.right - this.config.margin.left]);
      this.xScale.domain(this.xAxisData);
    } else {
      this.xScale = d3[this.config.xScale]().range([0, this.width - this.config.margin.right - this.config.margin.left]);
      this.xScale.domain(d3.extent(this.xAxisData));
    }

    this.yAxisData = [];
    this.config.data.forEach((d) => {
      this.config.yProps.forEach( (yProp, i) => { this.yAxisData.push(d[i][yProp]); });
    });

    if (!this.config.yScale || this.config.yScale === scalePoint) {
      this.yScale = d3.scalePoint().range([this.height - this.config.margin.top - this.config.margin.bottom, 0]);
      this.yScale.domain(this.yAxisData);
    } else {
      this.yScale = d3[this.config.yScale]().range([this.height - this.config.margin.top - this.config.margin.bottom, 0]);
      this.yScale.domain(d3.extent(this.yAxisData.sort((a, b) => a - b)));
    }
  }

  brushended() {
    const { selection } = d3.event;
    if (!selection) { return; }
    const brushedNodes = this.config.data.filter(d => {
      return rectContains(selection, [this.xScale(d[0][this.config.xProp]), this.yScale(d[0][this.config.yProps[0]]), this.yScale(d[1][this.config.yProps[1]])])
    });

    console.log(brushedNodes);
    if (!brushedNodes.length) { return; }
    this.previousData = [...this.config.data];
    this.config.data = brushedNodes;
    this.clearChart();
    this.drawChart();
  }

  drawAxis() {
    this.svg.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', 'translate(0,' + (this.height - this.config.margin.top - this.config.margin.bottom) + ')')
        .call(d3.axisBottom(this.xScale));

    this.svg.append('g')
        .attr('class', 'axis axis--y')
        .call(d3.axisLeft(this.yScale));

    this.svg.append('text')
        .attr('class', 'axis-title')
        .attr('transform', `translate(${this.width - this.config.margin.left - this.config.margin.right}, ${this.height - this.config.margin.bottom + 10})`)
        .style('text-anchor', 'end')
        .text(this.config.xLabel || '');
  }

  drawGrid() {
    const x2 = this.width - this.config.margin.left - this.config.margin.right;
    const y2 = this.height - this.config.margin.top - this.config.margin.bottom;
    const xAxisData = this.xScale.ticks ? this.xScale.ticks() : this.xAxisData;
    const yAxisData = this.yScale.ticks ? this.yScale.ticks() : this.yAxisData;

    this.svg.selectAll('grid-x-line')
        .data(xAxisData)
        .enter()
        .append('line')
        .attr('class', 'grid-x-line')
        .attr('stroke', '#efefef')
        .attr('x1', (d, i) => this.xScale(d) )
        .attr('y1', (d) => 4 )
        .attr('x2', (d) => this.xScale(d) )
        .attr('y2', (d) => y2 );

    this.svg.selectAll('grid-y-line')
        .data(yAxisData)
        .enter()
        .append('line')
        .attr('class', 'grid-y-line')
        .attr('stroke', '#efefef')
        .attr('x1', (d, i) => 0 )
        .attr('y1', (d) => this.yScale(d))
        .attr('x2', (d) => x2 )
        .attr('y2', (d) => this.yScale(d));
  }

  drawMultiLineChart() {
    this.line = d3.line()
        .x( (d) => this.xScale(d['x']) )
        .y( (d) => this.yScale(d['y']) );

    for (let i = 0; i < this.config.data[0].length; i++) {
      this.plotPath(i);
      this.plotPoints(i);
    }
  }

  plotPath(i) {
    this.svg.append('path')
        .datum(this.config.data.map((d) => {
          return {
            x: d[i][this.config.xProp],
            y: d[i][this.config.yProps[i]]
          };
         }))
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('stroke', COLORS(i))
        .attr('stroke-width', 1.5)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', this.line);
  }

  plotPoints(i) {
    this.svg.selectAll('dot')
        .data(this.config.data)
        .enter()
        .append('circle')
        .attr('class', 'point')
        .attr('fill', 'transparent')
        .attr('r', 4)
        .attr('cx', (d) => this.xScale(d[i][this.config.xProp]) )
        .attr('cy', (d) => this.yScale(d[i][this.config.yProps[i]]) )
        .on('mouseover', (d, v, circles) => {
          circles[v].setAttribute('fill', COLORS(i));
          this.tooltipContainer.transition()
              .duration(100)
              .style('opacity', .99);
          const tooltip = `<b>${d[i][this.config.xProp]}<b> <br/>` +
               this.config.yProps
              .map((yProp, index) => `<span style="color: ${COLORS(index)}">${yProp}:  ${d[index][yProp]}<span>`)
              .join('<br>');
          this.tooltipContainer.html(tooltip)
              .style('left', (d3.event.pageX + 4) + 'px')
              .style('top', (d3.event.pageY - 28) + 'px');
          })
      .on('mouseout', (d, v, circles) => {
          this.tooltipContainer.transition()
              .duration(100)
              .style('opacity', 0);
          circles[v].setAttribute('fill', 'transparent');
      });
  }

  drawLegend() {
    const yPosition = this.height - this.config.margin.top - (this.config.margin.bottom / 3);
    const legend = this.svg.append('g');

    legend.selectAll('legend')
        .data(this.config.yProps)
        .enter()
        .append('circle')
        .attr('class', 'legend')
        .attr('fill', (d, i) => COLORS(i))
        .attr('r', 4)
        .attr('cx', (d, i) => i * 50 )
        .attr('cy', yPosition);

    legend.selectAll('legend-text')
        .data(this.config.yProps)
        .enter()
        .append('text')
        .attr('class', 'legend-text')
        .attr('color', (d, i) => COLORS(i))
        .attr('x', (d, i) => (i * 50) + 5)
        .attr('y', yPosition + 4)
        .text((d, i) => this.config.yProps[i]);
  }

  resetChart() {
    this.config.data = [...this.previousData];
    this.previousData = [];

    this.clearChart();
    this.drawChart();
  }

  drawBrush() {
    this.brush = d3.brush()
      .extent([[0, 0], [this.width - this.config.margin.right - this.config.margin.left, this.height - this.config.margin.top - this.config.margin.bottom]])
      .on("end", this.brushended.bind(this));
      
    this.svg.append('g')
      .attr("class", "brush")
      .call(this.brush);
  }
}
