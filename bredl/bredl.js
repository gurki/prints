const { draw, drawRectangle, drawCircle, Drawing, Plane } = replicad;

const defaultParams = {
  top: 110,
  bottom: 440,
  depth: 500,
  height: 10,
  saddle: 10, //  width
  bridgeStart: 10,
  bridgeEnd: 20,
  bridge: 15,
  margin: 10  //  from top to bridge
};

const main = ( _, params ) => {

  const d_2 = params.depth / 2;
  const t_2 = params.top / 2;
  const b_2 = params.bottom / 2;

  //  board

  const base = draw()
    .movePointerTo( [ 0, d_2 ] )
    .hLineTo( t_2 )
    .lineTo( [ b_2, -d_2 ] )
    .hLineTo( 0 )
    .close()
    .sketchOnPlane()
    .extrude( params.height );

  const saddle = draw()
    .movePointerTo( [ t_2, d_2 ] )
    .hLineTo( t_2 + params.saddle )
    .lineTo( [ b_2 + params.saddle, -d_2 ] )
    .hLineTo( b_2 )
    .close()
    .sketchOnPlane()
    .extrude( params.height + params.bridgeEnd );

  let board = base.fuse( saddle );
  board = board.fuse( board.clone().mirror( "YZ" ) );
  board = board.fillet( 4,
    e => e.either([
      e => e.inBox( [ -b_2, -d_2, 0 ], [ b_2, d_2, params.height ] ),
      e => e.inDirection( "Z" ),
      e => e.atDistance( 0, [ t_2 + params.saddle, d_2, params.bridgeEnd + params.height ] ),
      e => e.atDistance( 0, [ - t_2 - params.saddle, d_2, params.bridgeEnd + params.height ] )
    ])
  )

  //  bridges

  const xt = t_2;
  const xb = b_2;
  const yt = d_2;
  const yb = -d_2;

  const dy = yb - yt;
  const dx = xb - xt;
  const m = dy / dx;
  const c = yb - m * xb;

  let bridges = undefined;

  for ( let i = 0; i < 32; i++ ) {

    const y1 = yt - params.margin - i * params.bridge;
    const y2 = yt - params.margin - ( i + 1 ) * params.bridge;
    const x1 = ( y1 - c ) / m;
    const x2 = ( y2 - c ) / m;

    let wall = draw()
      .movePointerTo( [ x1, 0 ] )
      .hLineTo( -x1 )
      .vLine( params.bridgeStart )
      .lineTo( [ x1, params.bridgeEnd ] )
      .close()
      .sketchOnPlane( "XZ", [ 0, y1 ] )
      .extrude( params.bridge )
      .translate( 0, 0, params.height );

    const gapEnd = draw()
      .movePointerTo( [ x1, y1 ] )
      .vLine( - params.bridge )
      .hLineTo( x2 )
      .close()
      .sketchOnPlane( "XY", params.height )
      .extrude( params.bridgeEnd );

    const gapStart = draw()
      .movePointerTo( [ -x1, y1 ] )
      .vLine( - params.bridge )
      .hLineTo( -x2 )
      .close()
      .sketchOnPlane( "XY", params.height )
      .extrude( params.bridgeStart );

    let bridge = wall.fuse( gapEnd ).fuse( gapStart );
    if ( i % 2 ) bridge = bridge.mirror( "YZ" );
    if ( ! bridges ) bridges = bridge;
    else bridges = bridges.fuse( bridge );

  }

  return board.fuse( bridges );

};
