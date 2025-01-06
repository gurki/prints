//  [1] https://dmccooey.com/polyhedra/TruncatedIcosahedron.html


const { 
  draw, drawRectangle, drawCircle, drawPolysides, 
  FaceFinder, EdgeFinder, 
  lookFromPlane 
} = replicad;

const defaultParams = {
  sides: 6
};


const lh = 0.2;
const l = 0.45;

const size = 200;
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
  return { r, R, t };
} 


function repeatPoly( shape, sides, offset = 0, stride = 1 ) {

  const increment = 360 / sides;
  const theta0 = ( ( sides === 5 ) ? -90 : 0 );
  let res = shape.clone().rotate( theta0 + offset * increment );

  for ( let i = offset + stride; i < sides; i += stride ) {
    res = res.fuse( shape.clone().rotate( theta0 + i * increment ) );
  }

  return res;

}


function snapFit( options = {
    length, //  beam length
    beamThin: 0.2, //  beam end
    beamThick: 0.4,  //  beam start
    overhang: 0.2, //  overhang depth
    hook: 0.2, //  hook length
    retraction: 0, //  retraction side width
    radiusHook: false, //  mount radius
    radiusBack: true
  }) {

  const { length, beamThin, beamThick, overhang, hook, retraction, radiusHook, radiusBack } = options;

  //  https://coloringchaos.github.io/form-fall-16/joints
  let drawing = draw();

  if ( radiusHook ) {
    drawing = drawing
      .vLine( overhang )
      .bulgeArcTo( [ overhang, 0 ], overhang );
  }

  drawing = drawing
    .hLineTo( length )
    .line( retraction, overhang )
    .hLine( hook )
    .line( overhang, -overhang )
    .vLine( -beamThin )

  if ( radiusBack ) {
    drawing = drawing
      .lineTo( [ overhang, -beamThick ] )
      .tangentArcTo( [ 0, -beamThick - overhang ], overhang )
  } else {
    drawing = drawing.lineTo( [ 0, -beamThick ] );
  }
    
  drawing = drawing.close();
  return drawing;

}


const main = ( _, params ) => {

  const { sides } = params;

  const isHex = sides === 6;
  const Su = Math.sqrt( 2 * ( 29 + 9 * Math.sqrt( 5 ) ) ) / 4;  //  unit circum sphere radius
  const t = size / ( 2 * Su );  //  edge length

  // const S = t * Su;
  const d6 = t * ( 3 * Math.sqrt( 3 ) + Math.sqrt( 15 ) ) / 4;
  const d5 = t * Math.sqrt( 10 * ( 125 + 41 * Math.sqrt( 5 ) ) ) / 20;

  const tol = 0.2;

  const snapOptions = {
    length: 2 + tol,
    beamThin: 2 * l, //  beam end
    beamThick: 3 * l,  //  beam start
    overhang: 2 * l, //  overhang depth
    hook: 2 * l, //  hook length
    retraction: 0, //  retraction side width
    radiusHook: false, //  mount radius
    radiusBack: true
  }
  const male = drawRectangle( 2, 20 ).sketchOnPlane().extrude( h ).translate( -1 );
  const hook1 = snapFit( snapOptions ).sketchOnPlane().extrude( 4 ).translate( 0, 2, 0 );
  const hook2 = snapFit( snapOptions ).sketchOnPlane().extrude( 4 ).mirror( "XZ").translate( 0, -2, 0 );
  const hooks = hook1.fuse( hook2 ).translate( 0, 0, 3 ); 
  const cutout1 = drawRectangle( 4 + 2 * tol, 4 + 2 * tol ).sketchOnPlane( "YZ" ).extrude( 10 ).translate( 0, 0, 5 );
  // const cutout2 = drawRectangle( 4 + 2 * tol + 2 * snapOptions.overhang, 4 + 2 * tol ).sketchOnPlane( "YZ", wall - tol ).extrude( 10 ).translate( 0, 0, 5 );
  const female = male.clone().translate( 2 ).cut( cutout1 )//.cut( cutout2 );
  return [ male.fuse( hooks ),  ];

  const d = isHex ? d6 : d5;
  const { r, R } = fromSide( t, sides );
  const Rinner = R * ( d - h ) / d;
  const { r: rinner, t: tinner } = fromCircumscribed( Rinner, sides );

  //  body

  const hexl = drawPolysides( R, sides ).sketchOnPlane();
  const hexs = drawPolysides( Rinner, sides ).sketchOnPlane( "XY", h )
  let hex = hexl.clone().loftWith( hexs.clone() );
    
  //  cone

  const coneTolerance = 0.5;
  const fixtureSize = 12.2 - coneTolerance;
  const rcone = fixtureSize / 2 + wall;
  const { R: Rcone } = fromInscribed( rcone, sides );

  const hexlc = drawPolysides( R, sides ).sketchOnPlane();
  const hexsc = drawPolysides( Rcone, sides ).sketchOnPlane( "XY", h2 )
  let hexc = hexlc.clone().loftWith( hexsc.clone() );

  //  fixture

  const fixture = drawCircle( fixtureSize + wall )
    .cut( drawCircle( ( fixtureSize + coneTolerance ) / 2 ) )
    .sketchOnPlane( "XY", h2 )
    .extrude( - 3 * lh )
    .intersect( hexc.clone() );

  //  cutouts 

  hex = hex.cut( hexc );

  const hexlc2 = drawPolysides( R - wall, sides ).sketchOnPlane();
  const hexsc2 = drawPolysides( Rcone - wall, sides ).sketchOnPlane( "XY", h2 )
  const hexc2 = hexlc2.clone().loftWith( hexsc2 );

  const floor = hexlc2.extrude( 2 * lh );
  hexc = hexc.cut( hexc2 ).fuse( floor );

  hex = hex.fuse( hexc );
  hex = hex.fuse( fixture );

  //  connector nobs

  const inclination = 180 / Math.PI * Math.atan2( h, r - rinner );
  const nobSize = wall;
  const nobRim = l * 0.5;
  const jointOffset = 1 / 4 * ( t + tinner ) / 2;
  const tolerance = 0.1;

  if ( isHex ) {
      
    const unobDrawing = draw()
      .vLine( nobSize )
      .hLine( wall )
      .vLine( nobRim )
      .lineTo( [ wall * 2, nobSize - nobRim ] )    
      .vLineTo( 0 )
      .close();

    const unob = unobDrawing
      .sketchOnPlane()
      .revolve( [ 1, 0 ] );

    const nob = unob
      .clone()
      .rotate( -90 + inclination, [], [ 0, 1, 0 ] )
      .translate( ( rinner + r ) / 2, - jointOffset, h / 2 );

    const nobs = repeatPoly( nob, sides, 0, 2 );

    hex = hex.fuse( nobs );

    const uhole = unobDrawing
      .clone()
      .offset( tolerance )
      .cut( drawRectangle( R, R ).translate( 0, - R / 2 ) )
      .sketchOnPlane()
      .revolve( [ 1, 0 ] );

    const hole = uhole
      .clone()
      .mirror( "YZ" )
      .rotate( -90 + inclination, [], [ 0, 1, 0 ] )
      .translate( ( rinner + r ) / 2, jointOffset, h / 2 );

    const holes = repeatPoly( hole, sides, 0, 2 );
    hex = hex.cut( holes );

  }

  //  snap fit

  const railTolerance = 0.2;
  const railLength = tinner / 2;
  const railRadius = 2 * l;

  if ( isHex ) {
    
    const railNeg = drawCircle( railRadius )
      .sketchOnPlane( "XZ", - railLength / 2 )
      .extrude( railLength )
      .translate( ( rinner + r ) / 2, 0, h / 2 );    

    const railNegs = repeatPoly( railNeg, sides, 1, 2 ).fillet( railRadius );
    hex = hex.cut( railNegs );

  } else {

    const rail = drawCircle( railRadius )
      .sketchOnPlane( "XZ", - railLength / 2 )
      .extrude( railLength )
      .translate( ( rinner + r ) / 2, 0, h / 2 );
      
    const rails = repeatPoly( rail, sides, 0, 1 ).fillet( railRadius );
    hex = hex.fuse( rails );

  }
  
  return hex;

};
