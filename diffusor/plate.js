const { draw, drawRectangle, drawCircle } = replicad;

const defaultParams = {
  stripWidth: 11,
  tubeDiameter: 25,
  tubeHeight: 64,
  mode: "l1o",
};

const offsets = {
  "l1o": 0.92,
  "l1c": -0.86,
  "l2o": 1.71,
  "l2c": -0.01,
}

const main = ( _, params ) => {

  const open = [ "l1o", "l2o" ].includes( params.mode );
  const single = [ "l1o", "l1c" ].includes( params.mode );

  const height = open ? 1.2 : 2.8;
  const tubeThickness = single ? 0.45 : 0.84;
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

  //  plate
  const cx = 4;
  const cy = 5;
  const m = 2;
  const h = 6;

  let standPlate = drawRectangle( ( 2 * r1 + m ) * cx + m, ( 2 * r1 + m ) * cy + m, m )
    .sketchOnPlane()
    .extrude( -1 );

  let stand = drawCircle( r2 - 0.2 )
    .cut( drawRectangle( 2 * r2, r2 ).translate( 0, -r2 ))
  const x0 = - ( ( 2 * r1 + m ) * ( cx - 1 ) ) / 2;
  const y0 = - ( ( 2 * r1 + m ) * ( cy - 1 ) ) / 2;
  
  for ( let x = 0; x < cx; x++ ) {
    for ( let y = 0; y < cy; y++ ) {
      let curr = stand
        .clone()
        .translate( x0 + ( 2 * r1 + m ) * x, y0 + ( 2 * r1 + m ) * y )
        .sketchOnPlane()
        .extrude( h );
      standPlate = standPlate.fuse( curr );
    }
  }

  return standPlate.fillet( 2, e => e.and( [ 
    e => e.ofCurveType( "CIRCLE" ),   
    e => e.inPlane( "XY", h )
  ]));

  return drawing.sketchOnPlane().extrude( params.tubeHeight );
  
};
