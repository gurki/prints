const { draw, drawRectangle, drawCircle } = replicad;

const defaultParams = {
  stripWidth: 11,
  tubeDiameter: 25,
  tubeHeight: 64,
  mode: "l2c",
};

const offsets = {
  "l1o": 0.92,
  "l1c": -0.86,
  "l2o": 1.83,
  "l2c": 0.12,
}

const main = ( _, params ) => {

  const open = [ "l1o", "l2o" ].includes( params.mode );
  const single = [ "l1o", "l1c" ].includes( params.mode );

  const height = open ? 1.2 : 2.8;
  const tubeThickness = single ? 0.45 : 0.9;
  const canalThickness = tubeThickness;
  const offset = offsets[ params.mode ];

  const d = params.tubeDiameter;
  const r1 = params.tubeDiameter / 2;
  const r2 = r1 - tubeThickness;

  const innerCanal = drawRectangle( params.stripWidth, height, height / 4 )
  let canal = innerCanal
    .offset( canalThickness )
    .cut( innerCanal )
    .translate( 0, - height / 2 - canalThickness );
  
  if ( open ) {
    canal = canal.cut( 
      drawRectangle( params.stripWidth - 2 * 2, canalThickness )
      .translate( 0, -canalThickness / 2 ) 
    );
  }

  let tube = drawCircle( r1 ).cut( drawCircle( r2 ) );
  tube = tube.cut( 
    drawRectangle( params.stripWidth, d )
    .translate( 0, - r1  ) 
  )
  
  const drawing = tube.fuse( canal.translate( 0, - r1 + 2 * height + offset ) );
  // return drawing
  return drawing.sketchOnPlane().extrude( params.tubeHeight );
  
};
