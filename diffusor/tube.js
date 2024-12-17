const { draw, drawRectangle, drawCircle } = replicad;

const defaultParams = {
  stripWidth: 11,
  tubeDiameter: 20,
  tubeHeight: 64,
  edge: 2.0,
  mode: "l2o",
};


const main = ( _, params ) => {

  const open = [ "l1o", "l2o" ].includes( params.mode );
  const single = [ "l1o", "l1c" ].includes( params.mode );

  const height = open ? 1.2 : 2.8;
  const thickness = single ? 0.45 : 0.85; //  second layer: 0.42 per
  const radius = height / 4;

  const d = params.tubeDiameter;
  const r1 = d / 2;
  const r2 = r1 + thickness;

  const innerCanal = drawRectangle( params.stripWidth, height, radius )
  let canal = drawRectangle( params.stripWidth + 2 * thickness, height + 2 * thickness, 2 * radius )
    .cut( innerCanal )
    .translate( 0, height / 2 + thickness );


  if ( open ) {
    canal = canal.cut( 
      drawRectangle( params.stripWidth - 2 * params.edge, thickness )
      .translate( 0, -thickness / 2 + height + 2 * thickness ) 
    );
    canal = canal.fillet( radius );
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
    drawRectangle( 2 * r2, r2 )
    .translate( 0, -r2 / 2 - c )
  );
  const drawing = tube
    .fuse( canal.translate( 0, -c  ) )
    .fuse( drawRectangle( 2 * b, thickness ).translate( 0, thickness / 2 - c ) );
  
  //  plate
  // const cx = 4;
  // const cy = 5;
  // const m = 2;
  // const h = 6;

  // let standPlate = drawRectangle( ( 2 * r1 + m ) * cx + m, ( 2 * r1 + m ) * cy + m, m )
  //   .sketchOnPlane()
  //   .extrude( -1 );

  // let stand = drawCircle( r2 - 0.1 )
  //   .cut( drawRectangle( 2 * r2, r2 ).translate( 0, -r2 ))
  // const x0 = - ( ( 2 * r1 + m ) * ( cx - 1 ) ) / 2;
  // const y0 = - ( ( 2 * r1 + m ) * ( cy - 1 ) ) / 2;
  
  // for ( let x = 0; x < cx; x++ ) {
  //   for ( let y = 0; y < cy; y++ ) {
  //     let curr = stand
  //       .clone()
  //       .translate( x0 + ( 2 * r1 + m ) * x, y0 + ( 2 * r1 + m ) * y )
  //       .sketchOnPlane()
  //       .extrude( h );
  //     standPlate = standPlate.fuse( curr );
  //   }
  // }

  // return standPlate.fillet( 2, e => e.and( [ 
  //   e => e.ofCurveType( "CIRCLE" ),   
  //   e => e.inPlane( "XY", h )
  // ]));

  return drawing
    .sketchOnPlane()
    .extrude( params.tubeHeight );
  
};
