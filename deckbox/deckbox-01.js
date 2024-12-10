const { draw, drawRectangle, drawCircle } = replicad;

const defaultParams = {
  deckWidth: 70,
  deckDepth: 37.2,
  deckHeight: 98,
  cardBottom: 40,
  cardTop: 79,
  wallThickness: 2,
  dividerThickness: 2,
  pocketWidth: 8,
  magnetSize: 5,
  magnetHeight: 3,
  magnetTolerance: 0.2
};

const main = ( _, params ) => {
  
  //  main block
  const boxWidth = 2 * params.deckWidth + params.dividerThickness + 2 * params.wallThickness + 2 * params.pocketWidth;
  const boxDepth = params.deckDepth + 4 * params.wallThickness;
  const rimHeight = params.wallThickness + params.cardTop;

  let box = drawRectangle( boxWidth, boxDepth )
    .sketchOnPlane()
    .extrude( rimHeight );

  //  top rim with slanted walls
  const rimWidth = 2 * params.deckWidth + params.dividerThickness + 2 * params.wallThickness;
  const rimDepth = params.deckDepth + 2 * params.wallThickness;
  const rimThickness = params.wallThickness / 2;
  const boxHeight = params.deckHeight + params.wallThickness;

  let rimBottom = drawRectangle( rimWidth, rimDepth )
    .sketchOnPlane( "XY", rimHeight );
  let rimTop = drawRectangle( rimWidth - rimThickness, rimDepth - rimThickness )
    .sketchOnPlane( "XY", boxHeight );

  let rimSolid = rimBottom.loftWith( rimTop );
  let rim = rimSolid.clone();

  //  rim fillets
  rim = rim.fillet( params.wallThickness, 
    e => e.not( e => e.either([
      e => e.inDirection( "X" ),
      e => e.inDirection( "Y" ),
    ]))
  );

  rim = rim.fillet( params.wallThickness, 
    e => e.inPlane( "XY", boxHeight )
  );

  box = box.fuse( rim );

  //  content cutouts
  const innerWidth = params.deckWidth;
  const innerCutoutA = drawRectangle( innerWidth, params.deckDepth )
    .translate( innerWidth / 2 + params.dividerThickness / 2  )
    .sketchOnPlane( "XY", params.wallThickness )
    .extrude( boxHeight );
  const innerCutoutB = innerCutoutA.clone().mirror( "ZY" );
  box = box.cut( innerCutoutA );
  box = box.cut( innerCutoutB );

  //  magnets
  let magnetSketch = drawCircle( ( params.magnetSize + params.magnetTolerance ) / 2 )
    .translate( boxWidth / 2 - params.pocketWidth / 2, boxDepth / 2 - params.pocketWidth / 2 )
    .sketchOnPlane( "XY", rimHeight );

  magnetSketch = magnetSketch.fuse( magnetSketch.clone().mirror( "XZ" ) );
  magnetSketch = magnetSketch.fuse( magnetSketch.clone().mirror( "YZ" ) );
    
  const magnets = magnetSketch.extrude( - ( params.magnetHeight + params.magnetTolerance ) );
  box = box.cut( magnets );

  //  box fillets
  box = box.fillet( params.wallThickness, e => e.either([
      e => e.ofLength( rimHeight ),
      e => e.inPlane( "XY" )
  ]) );

  //  lid

  const lidHeight = boxHeight - rimHeight;

  let lid = drawRectangle( boxWidth, boxDepth )
    .sketchOnPlane( "XY", rimHeight )
    .extrude( lidHeight );

  //  outer fillet
  lid = lid.fillet( params.wallThickness, 
    e => e.not( e => e.inPlane( "XY", rimHeight ) )
  );

  let lidCutout = drawRectangle( rimWidth, rimDepth )
    .sketchOnPlane( "XY", rimHeight )
    .extrude( lidHeight - params.wallThickness );

  lid = lid.cut( lidCutout );
  lid = lid.cut( magnetSketch.extrude( params.magnetHeight + params.magnetTolerance ) );

  return {
    shape: lid
    // highlightEdge: 
  };
  
};
