module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const supabaseUrl=process.env.SUPABASE_URL||'';
  const supabaseAnonKey=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'';
  if(!supabaseUrl||!supabaseAnonKey)return res.status(503).json({configured:false,error:'Supabase authentication is not configured in Vercel'});
  return res.status(200).json({configured:true,supabaseUrl,supabaseAnonKey,product:'MarginBusiness Leads',version:'3.0',appUrl:process.env.APP_URL||'',googleAuth:String(process.env.ENABLE_GOOGLE_AUTH||'false').toLowerCase()==='true'});
};
