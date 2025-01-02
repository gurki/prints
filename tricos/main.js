//  [1] https://dmccooey.com/polyhedra/TruncatedIcosahedron.html


const { 
  draw, drawRectangle, drawCircle, drawPolysides, 
  FaceFinder, EdgeFinder, 
  lookFromPlane 
} = replicad;

const defaultParams = {};


const lh = 0.2;
const l = 0.45;

const sides = 5;
const size = 160;
const h = 10;
const h2 = 30;
const hled = 2;
const wled = 10.2;
const wall = 3 * l;
const ledWall = wall;
const hrest = 2 * l;


function fromInscribed( r, sides ) {
  const isHex = ( sides === 6 );
  const t = isHex ? r * ( 2 / Math.sqrt( 3 ) ) : r * ( 2 * Math.sqrt( 5 - Math.sqrt( 20 ) ) );
  const R = isHex ? t : t * Math.sqrt( ( 5 + Math.sqrt( 5 ) ) / 10 );
  return { r, R, t };
} 


function fromSide( t, sides ) {
  const isHex = ( sides === 6 );
  const R = isHex ? t : t * Math.sqrt( ( 5 + Math.sqrt( 5 ) ) / 10 );
  const r = isHex ? Math.sqrt( 3 ) / 2 * t : t / ( 2 * Math.sqrt( 5 - Math.sqrt( 20 ) ) ); 
  return { r, R, t };
} 


function fromCircumscribed( R, sides ) {
  const isHex = ( sides === 6 );
  const t = isHex ? R : Math.sqrt( ( 5 - Math.sqrt( 5 ) ) / 2 ) * R;
  const r = isHex ? Math.sqrt( 3 ) / 2 * t : t / ( 2 * Math.sqrt( 5 - Math.sqrt( 20 ) ) );
  console.log( R, t, r );
  return { r, R, t };
} 


function repeatPoly( shape, sides ) {

  const theta0 = ( sides === 5 ) ? -90 : 0;
  let res = shape.clone().rotate( theta0 );

  for ( let i = 1; i < sides; i++ ) {
    res = res.fuse( shape.clone().rotate( theta0 + i * 360 / sides ) );
  }

  return res;

}


const main = ( _, params ) => {

  const isHex = sides === 6;
  const Su = Math.sqrt( 2 * ( 29 + 9 * Math.sqrt( 5 ) ) ) / 4;  //  unit circum sphere radius
  const t = size / ( 2 * Su );  //  edge length

  // const S = t * Su;
  const d6 = t * ( 3 * Math.sqrt( 3 ) + Math.sqrt( 15 ) ) / 4;
  const d5 = t * Math.sqrt( 10 * ( 125 + 41 * Math.sqrt( 5 ) ) ) / 20;

  const d = isHex ? d6 : d5;
  const { r, R } = fromSide( t, sides );
  const Rinner = R * ( d - h ) / d;
  const { r: rinner, t: tinner } = fromCircumscribed( Rinner, sides );

  //  body

  const hexl = drawPolysides( R, sides ).sketchOnPlane();
  const hexs = drawPolysides( Rinner, sides ).sketchOnPlane( "XY", h )
  let hex = hexl.clone().loftWith( hexs.clone() );
    
  //  cone

  const fixtureSize = 11.2;
  const rcone = fixtureSize / 2 + wall;
  const { R: Rcone } = fromInscribed( rcone, sides );

  const hexlc = drawPolysides( R, sides ).sketchOnPlane();
  const hexsc = drawPolysides( Rcone, sides ).sketchOnPlane( "XY", h2 )
  let hexc = hexlc.clone().loftWith( hexsc.clone() );

  //  fixture

  const fixture = drawCircle( fixtureSize + wall )
    .cut( drawCircle( fixtureSize / 2 + 0.2 ) )
    .sketchOnPlane( "XY", h2 )
    .extrude( -1 )
    .intersect( hexc.clone() );

  //  cutouts 

  hex = hex.cut( hexc );

  const hexlc2 = drawPolysides( R - wall, sides ).sketchOnPlane();
  const hexsc2 = drawPolysides( Rcone - wall, sides ).sketchOnPlane( "XY", h2 )
  const hexc2 = hexlc2.clone().loftWith( hexsc2 );

  const floor = hexlc2.extrude( lh );
  hexc = hexc.cut( hexc2 ).fuse( floor );

  hex = hex.fuse( hexc );
  hex = hex.fuse( fixture );

  //  connector nobs

  const inclination = 180 / Math.PI * Math.atan2( h, r - rinner );
  const nobSize = wall;
  const nobRim = l * 0.5;
  const jointOffset = 1 / 4 * ( t + tinner ) / 2;

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
    .clone()
    .rotate( -90 + inclination, [], [ 0, 1, 0 ] )
    .translate( ( rinner + r ) / 2, - jointOffset, h / 2 );

  const nobs = repeatPoly( nob, sides );

  hex = hex.fuse( nobs );

  const hole = unob
    .clone()
    .translate( - 0.2 )
    .mirror( "YZ" )
    .rotate( -90 + inclination, [], [ 0, 1, 0 ] )
    .translate( ( rinner + r ) / 2, jointOffset, h / 2 );

  const holes = repeatPoly( hole, sides );
  hex = hex.cut( holes );
  
  return {
    shape: hex
  }

};
