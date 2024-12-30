//  [1] https://dmccooey.com/polyhedra/TruncatedIcosahedron.html


const { 
  draw, drawRectangle, drawCircle, drawPolysides, 
  FaceFinder, EdgeFinder, 
  lookFromPlane 
} = replicad;

const defaultParams = {};


const l = 0.45;

const sides = 6;
const size = 160;
const h = 20;
const hled = 2;
const wled = 10.2;
const wall = 3 * l;


function repeatPoly( shape, sides ) {

  const theta0 = ( sides === 5 ) ? -90 : 0;
  let res = shape.clone().rotate( theta0 );

  for ( let i = 1; i < sides; i++ ) {
    res = res.fuse( shape.clone().rotate( theta0 + i * 360 / sides ) );
  }

  return res;

}


const main = ( _, params ) => {

  // //  8x8 matrix box
  // {
  //   const s = 66;
  //   const h = 10;
  //   const t = 0.9;
  
  //   return drawRectangle( s, s )
  //     .sketchOnPlane()
  //     .extrude( h )
  //     .shell( t, f => f.either( [
  //       f => f.inPlane( "XY", 0 ),
  //       f => f.inPlane( "XY", h )
  //     ]))
  //     .fuse( 
  //       drawRectangle( s, s )
  //         .sketchOnPlane()
  //         .extrude( 0.45 )
  //     )
  //     .fillet( t, e => e.not( e => e.inPlane( "XY", h ) ) )
  //     // .cut( 
  //     //   drawRectangle( s, 8 )
  //     //     .translate( -s/2, s/2 - t - 8/2 )
  //     //     .sketchOnPlane( "XY", h )
  //     //     .extrude( -2 )
  //     // )
  // }

  const isHex = sides === 6;
  const Su = Math.sqrt( 2 * ( 29 + 9 * Math.sqrt( 5 ) ) ) / 4;  //  unit circum sphere radius
  const t = size / ( 2 * Su );  //  edge length

  // const S = t * Su;
  const d6 = t * ( 3 * Math.sqrt( 3 ) + Math.sqrt( 15 ) ) / 4;
  const d5 = t * Math.sqrt( 10 * ( 125 + 41 * Math.sqrt( 5 ) ) ) / 20;

  const d = isHex ? d6 : d5;
  const R = isHex ? t : t * Math.sqrt( ( 5 + Math.sqrt( 5 ) ) / 10 );  //  circumscribed circle
  const r = isHex ? Math.sqrt( 3 ) / 2 * t : t / ( 2 * Math.sqrt( 5 - Math.sqrt( 20 ) ) );  //  inscribed circle
  const Rinner = R * ( d - h ) / d;
  const tinner = isHex ? Rinner : Math.sqrt( ( 5 - Math.sqrt( 5 ) ) / 2 ) * Rinner;
  const rinner = isHex ? Math.sqrt( 3 ) / 2 * tinner : tinner / ( 2 * Math.sqrt( 5 - Math.sqrt( 20 ) ) );

  const hexl = drawPolysides( R, sides )
    .sketchOnPlane();

  const hexs = drawPolysides( Rinner, sides )
    .sketchOnPlane( "XY", h )

  let hex = hexl.clone().loftWith( hexs.clone() );
  
  //  floor 

  const hexl2 = drawPolysides( R - wall, sides ).sketchOnPlane();
  const hexs2 = drawPolysides( Rinner - wall, sides ).sketchOnPlane( "XY", h )
  const hex2 = hexl2.clone().loftWith( hexs2 );
  const floor = hexl2.extrude( l );
  hex = hex.cut( hex2 ).fuse( floor );
  
  //  led holder

  const ledWall = wall;

  const rim =
    drawCircle( wled / 2 + ledWall )
    .cut( drawCircle( wled / 2 ) )
    .sketchOnPlane()
    .extrude( hled );

  const rest =
    drawCircle( wled / 2 + ledWall )
    // .cut( drawCircle( wled / 2 - 1 ) )
    .sketchOnPlane( "XY", hled )
    .extrude( 2 * l );

  const diffusor = draw()
    .hLineTo( wled / 2 + 2 * l )
    .vLine( ledWall )
    .tangentArc( - wled / 2 - 2 * l, wled / 2 + 2 * l )
    .close()
    .sketchOnPlane( "XZ" )
    .revolve( [ 0, 0, 1 ] )
    .shell( 2 * l, f => f.inPlane() );

  const pocket = rim.fuse( rest );

  const ic = pocket
    // .fuse( diffusor )
    .rotate( 180, [ 0, 0, 0 ], [ 1, 0, 0 ] )
    .translate( 0, 0, h );

  //  led bridges

  const bridge = drawRectangle( rinner - wled / 2, ledWall )
    .translate( rinner / 2 + wled / 4, 0 )
    .sketchOnPlane( "XY", h )
    .extrude( -hled );

  let bridges = repeatPoly( bridge, sides );
  const led = ic.fuse( bridges );

  hex = hex.fuse( led );

  //  connector nobs

  const inclination = 180 / Math.PI * Math.atan2( h, r - rinner );
  const nobSize = wall;
  const nobRim = l * 0.5;
  const jointOffset = 1 / 4 * ( t + tinner ) / 2;

  const hole = drawCircle( nobSize + nobRim / 2 )
    .sketchOnPlane()    
    .extrude( 2 * wall )
    .translate( 0, 0, - wall )
    .rotate( inclination, [], [ 0, 1, 0 ] )
    .translate( ( rinner + r ) / 2, jointOffset, h / 2 );

  const holes = repeatPoly( hole, sides );

  const unob = draw()
    .vLine( nobSize )
    .hLine( wall + 0.2 )
    .vLine( nobRim )
    .lineTo( [ wall * 2, nobSize - nobRim ] )    
    .vLineTo( 0 )
    .close()
    .sketchOnPlane()
    .revolve( [ 1, 0 ] );

  const nob = unob
    .rotate( -90 + inclination, [], [ 0, 1, 0 ] )
    .translate( ( rinner + r ) / 2, - jointOffset, h / 2 );

  const nobs = repeatPoly( nob, sides );

  hex = hex.cut( holes );
  hex = hex.fuse( nobs );
  
  return {
    shape: hex
  }

};
