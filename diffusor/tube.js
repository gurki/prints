const { draw, drawRectangle, drawCircle } = replicad;

const defaultParams = {
  stripWidth: 11,
  tubeDiameter: 30,
  tubeHeight: 60,
  edge: 2,  //  open strip clamp size
  overlap: 4,
  mode: "l2o",
  connector: true
};


const main = ( _, params ) => {

  const open = [ "l1o", "l2o" ].includes( params.mode );
  const single = [ "l1o", "l1c" ].includes( params.mode );

  const height = open ? 1.2 : 2.8;
  const thickness = single ? 0.42 : 0.84; //  second layer: 0.42 per
  const radius = thickness / 4;

  const d = params.tubeDiameter;
  const r1 = d / 2;
  const r2 = r1 + thickness;

  const innerCanal = drawRectangle( params.stripWidth, height )
  let canal = drawRectangle( params.stripWidth + 2 * thickness, height + 2 * thickness )
    .cut( innerCanal )
    .translate( 0, height / 2 + thickness );

  if ( open ) {

    canal = canal.cut( 
      drawRectangle( params.stripWidth - 2 * params.edge, thickness )
      .translate( 0, -thickness / 2 + height + 2 * thickness ) 
    );

    // canal = canal.fillet( radius );

  }

//
//  compute canal height offset `c` based on outer radius `a` at outer canal width `b`
//  
//        │        
//       /│\       
//      / │ \      
//   a /  │  \     
//    /   │c  \    
//   /    │    \   
//  ──────│──────  
//     b        
//

  const a = r2;
  const b = params.stripWidth / 2 + thickness;
  const c = Math.sqrt( a * a - b * b );
  
  let tube = drawCircle( r2 ).cut( drawCircle( r1 ) );

  tube = tube.cut( 
    draw( [ 0, 0 ] )
    .lineTo( [ -b, -c ] )
    .lineTo( [ b, -c ] )
    .close()
  );

  tube = tube.cut( 
    drawRectangle( 2 * a, a )
    .translate( 0, -a / 2 - c )
  );

  const drawing = tube
    .fuse( canal.translate( 0, -c  ) )
    .fuse( drawRectangle( 2 * b, thickness ).translate( 0, thickness / 2 - c ) )
    .fillet( height + 2 * thickness );

  let shape = drawing
    .sketchOnPlane()
    .extrude( params.tubeHeight );

  //////////////
  //  connector

  if ( params.connector ) {

    const railSize = 4 * thickness;
    const railWall = 2 * thickness;
    const wedgeLong = 5 * thickness;
    const wedgeShort = 3 * thickness;
    const notchSize = 0.45;
    const notchWidth = b - 2 * railWall;
    const railLength = 20;
    const tolerance = 0.2;

    let rail = drawRectangle( 2 * b, railSize )
      .translate( 0, railSize / 2 );

    let wedgeHead = draw()
      .hLineTo( wedgeShort )
      .lineTo( [ wedgeLong, railSize - railWall ] )
      .hLineTo( 0 )
      .closeWithMirror();

    const notchDrawing = drawCircle( notchSize );
    let notch = notchDrawing.clone()
      .sketchOnPlane( "YZ", notchWidth )
      .extrude( - 2 * notchWidth )
      .translate( 0, railSize / 2, thickness );

    let notchNeg = notchDrawing
      .offset( tolerance / 2 )
      .sketchOnPlane( "YZ", notchWidth + tolerance )
      .extrude( - 2 * ( notchWidth + tolerance ) )
      .translate( 0, railSize / 2, thickness );

    let wedge = drawRectangle( 2 * ( b - railWall ), railSize )
      .translate( 0, - railSize / 2 )
      .fuse( wedgeHead )
      .sketchOnPlane()
      .extrude( 2 * railLength - tolerance )
      .fillet( railSize / 2, e => e.inPlane( "XZ", railSize ) );

    wedge = wedge.cut( notchNeg.clone().fuse(
      notchNeg.clone().translateZ( 2 * railLength - 2 * thickness - notchSize / 2 ) )
    );

    // return wedge;

    rail = rail.cut( wedgeHead.offset( tolerance ) )
    rail = rail.sketchOnPlane().extrude( railLength );

    const stand = draw()
      .hLine( railSize )
      .lineTo( [ railSize, -2 * railSize ] )
      .close()
      .sketchOnPlane( "YZ", -b )
      .extrude( 2 * b )

    rail = rail.fuse( stand );
    rail = rail.fillet( thickness, e => e.and( [
      e => e.either([ e => e.inPlane( "YZ", b ), e => e.inPlane( "YZ", -b ) ]),
      e => e.not( e => e.inPlane( "XZ", -railSize ) ),
      e => e.not( e => e.inPlane( "XY", railLength ) )
    ]));

    rail = rail.translate( 0, - railSize + thickness - c );

    shape = shape
      .fuse( rail.clone().translate( 0, 0, params.tubeHeight - railLength ) )
      .fuse( rail.clone().mirror( [ 0, 0, 1 ] ).translate( 0, 0, railLength ) );
    
    notch = notch.translate( 0, - railSize + thickness - c + 0.2 );
    shape = shape.fuse( notch.clone().translate( 0, 0, params.tubeHeight - railLength ) );    
    shape = shape.fuse( notch.clone().mirror( [ 0, 0, 1 ] ).translate( 0, 0, railLength ) );    
  
  }

  return shape.rotate( 180 );

};
