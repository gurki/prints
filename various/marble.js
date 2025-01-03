const { draw, drawRectangle, drawCircle } = replicad;

const defaultParams = {};


const main = ( _, params ) => {

  const sphere = drawCircle( 10 )
    .cut( drawRectangle( 20, 20 )
    .translate( 10, 0 ) )
    .sketchOnPlane( "YZ" )
    .revolve();

  const block = drawRectangle( 40, 40 )
    .sketchOnPlane()
    .extrude( 20 );
   
  return block.cut( sphere.translateZ( 20 ) ).fillet( 5, e => e.not( e => e.inPlane() ) );

};
