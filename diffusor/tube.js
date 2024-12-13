const { draw, drawRectangle, drawCircle } = replicad;

const defaultParams = {
  stripWidth: 11,
  stripHeight: 1,
  tubeThickness: 0.45,
  tubeDiameter: 25,
  innerThickness: 0.45,
  tubeHeight: 64
};


const main = ( _, params ) => {

  const d = params.tubeDiameter;
  const r1 = params.tubeDiameter / 2;
  const r2 = r1 - params.tubeThickness;

  const innerCanal = drawRectangle( params.stripWidth, params.stripHeight, params.stripHeight / 4 )
  let canal = innerCanal
    .offset( params.innerThickness )
    .cut( innerCanal )
    .translate( 0, - params.stripHeight / 2 - params.innerThickness );

  canal = canal.cut( 
    drawRectangle( params.stripWidth - 2 * 2, params.innerThickness )
    .translate( 0, -params.innerThickness / 2 ) 
  );

  let tube = drawCircle( r1 ).cut( drawCircle( r2 ) );
  tube = tube.cut( 
    drawRectangle( params.stripWidth, d )
    .translate( 0, - r1  ) 
  )
  
  const drawing = tube.fuse( canal.translate( 0, - r1 + 2 * params.stripHeight + 1.14 ) );
  // return drawing;
  return drawing.sketchOnPlane().extrude( params.tubeHeight );
  
};
