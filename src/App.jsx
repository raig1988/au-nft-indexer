import {
  AspectRatio,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Alchemy, Network } from 'alchemy-sdk';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

// configurating alchemy
const config = {
  apiKey: import.meta.env.VITE_ALCHEMY_MAINNET_API,
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(config);

function App() {

  // accessing metamask account address with connect button
  const { address } = useAccount();

  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // api to get info
  async function getNFTsForOwner(nftAddress) {
    try {
      setLoading(true);
      const data = await alchemy.nft.getNftsForOwner(nftAddress);
      setResults(data);
  
      const tokenDataPromises = [];
  
      for (let i = 0; i < data.ownedNfts.length; i++) {
        const tokenData = await alchemy.nft.getNftMetadata(
          data.ownedNfts[i].contract.address,
          data.ownedNfts[i].tokenId, undefined, 0
        );
        tokenDataPromises.push(tokenData);
        console.log(tokenData.media[0].format);
      }
  
      setTokenDataObjects(await Promise.all(tokenDataPromises));
      setError('');
      setHasQueried(true);
      setLoading(false);
    } catch(e) {
      setError(e.toString());
    }
  }

  // runs the function when a new address is set
  useEffect(() => {
    if (address != undefined) {
      getNFTsForOwner(address);
    }
  }, [address])

  return (
    <>
      <Flex justifyContent="end" padding={"50px 100px"}>
        <ConnectButton />
      </Flex>
      <Box w="100vw">
        <Center>
          <Flex
            alignItems={'center'}
            justifyContent="center"
            flexDirection={'column'}
          >
            <Heading mb={0} fontSize={36}>
              NFT Indexer 🖼
            </Heading>
            <Text>
              Plug in an address and this website will return all of its NFTs!
            </Text>
          </Flex>
        </Center>
        <Flex
          w="100%"
          flexDirection="column"
          alignItems="center"
          justifyContent={'center'}
        >
          <Heading mt={42}>Get all the ERC-721 tokens of this address:</Heading>
          <Input
            onChange={(e) => setUserAddress(e.target.value)}
            color="black"
            w="600px"
            textAlign="center"
            p={4}
            bgColor="white"
            fontSize={24}
          />
          <Button fontSize={20} onClick={() => getNFTsForOwner(userAddress)} mt={36} bgColor="white" border={"black solid"}>
            Fetch NFTs
          </Button>

          <Heading my={36}>Here are your NFTs:</Heading>

          { loading && !error ? 
            <p>Loading...</p>
            : error ? 
            <>
              <p>Error in your request...</p>
              <p>{error}</p>
            </> :
            hasQueried ? (
            <SimpleGrid w={'90vw'} columns={4} spacing={24}>
              {results.ownedNfts.map((e, i) => {
                return (
                  <Flex
                    flexDir={'column'}
                    color="black"
                    bg="white"
                    border="black solid"
                    borderRadius={"10%"}
                    padding={"20px"}
                    textAlign={"center"}
                    justifyContent={'start'}
                    key={e.id}
                  >
                    <Box>
                      <b>Name:</b>{' '}
                      {tokenDataObjects[i].title?.length === 0
                        ? 'No Name'
                        : tokenDataObjects[i].title}
                    </Box>
                    {/* // if no image format, then set iframe for videos */}
                    {
                      tokenDataObjects[i]?.media[0]?.format == 'png' || tokenDataObjects[i]?.media?.format == 'jpg' ||  
                      tokenDataObjects[i]?.media[0]?.format == 'svg+xml' || tokenDataObjects[i]?.media[0]?.format == 'gif' ||
                      tokenDataObjects[i]?.media[0]?.format == 'jpeg' 
                      ? 
                        <Image
                          src={
                            tokenDataObjects[i]?.media[0]?.gateway ??
                            tokenDataObjects[i]?.rawMetadata?.image ??
                            tokenDataObjects[i]?.contract?.openSea?.imageUrl ??
                            'https://via.placeholder.com/200'
                          }
                          alt={'Image'}
                        /> :
                      <AspectRatio maxW='560px' ratio={1}>
                        <iframe
                          src={
                            tokenDataObjects[i]?.media[0]?.gateway ??
                            tokenDataObjects[i]?.rawMetadata?.image ??
                            tokenDataObjects[i]?.contract?.openSea?.imageUrl ??
                            'https://via.placeholder.com/200'
                          }
                          style={{objectFit: 'fill', objectPosition: '50% 50%'}}
                        />
                      </AspectRatio>
                    }
                  </Flex>
                );
              })}
            </SimpleGrid>
          ) : (
            'Please make a query! The query may take a few seconds...'
          )}
        </Flex>
      </Box>

    </>
  );
}

export default App;
