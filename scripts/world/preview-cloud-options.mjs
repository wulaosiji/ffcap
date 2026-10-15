/** Private localhost QA only. Existing three-argument preview stays unchanged. */
export function parseCloudPreviewOptions(args){
  if(args.length>5)throw new Error('Unexpected preview arguments')
  const [revision,upstream='4318',posterRevision=revision,listen='4321',delay='0']=args
  for(const value of [revision,posterRevision])if(!/^r12[a-z0-9-]+$/.test(value??''))throw new Error('Provide a private r12 revision')
  for(const value of [upstream,listen,delay])if(!/^\d+$/.test(value))throw new Error('Ports and delay must be decimal integers')
  const upstreamPort=Number(upstream),listenPort=Number(listen),modelDelayMs=Number(delay)
  for(const port of [upstreamPort,listenPort])if(port<1024||port>65535)throw new Error('Choose an unprivileged local port')
  if(upstreamPort===listenPort)throw new Error('Choose distinct local ports')
  if(modelDelayMs>10000)throw new Error('Model delay is limited to ten seconds')
  if(modelDelayMs&&listenPort===4321)throw new Error('Loading QA must not delay the user preview')
  return {revision,upstreamPort,posterRevision,listenPort,modelDelayMs}
}
