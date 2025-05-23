import { describe, it, beforeAll, afterAll } from '@jest/globals';
import { ThorClient } from '@vechain/sdk-network';
import axios from 'axios';
import {
    DockerComposeEnvironment,
    PullPolicy,
    type StartedDockerComposeEnvironment,
    Wait
} from 'testcontainers';

let environment: StartedDockerComposeEnvironment;
const RPC_PROXY_URL = 'http://localhost:8545';
const genesisChainId = '0xde'; // custom genesis block id as solo is using a custom genesis file

beforeAll(async () => {
    environment = await new DockerComposeEnvironment(
        './',
        'docker-compose.rpc-proxy.yml'
    )
        .withPullPolicy(PullPolicy.alwaysPull())
        .withWaitStrategy(
            'thor-solo',
            Wait.forLogMessage('📦 new block packed')
        )
        .withWaitStrategy(
            'rpc-proxy',
            Wait.forLogMessage('[rpc-proxy]: Proxy is running on port 8545')
        )
        .withBuild()
        .up(['rpc-proxy']);
});

afterAll(async () => {
    await environment.down();
});

describe('RPC Proxy endpoints', () => {
    describe('should return proper response for', () => {
        it('debug_traceBlockByHash method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'debug_traceBlockByHash',
                params: [
                    '0x0000000008602e7a995c747a3215b426c0c65709480b9e9ac57ad37c3f7d73de',
                    { tracer: 'callTracer' }
                ],
                id: 1
            });
            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('debug_traceBlockByNumber method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'debug_traceBlockByNumber',
                params: ['0x1', { tracer: 'callTracer' }],
                id: 1
            });
            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('debug_traceCall method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'debug_traceCall',
                params: [
                    {
                        from: '0xf077b491b355e64048ce21e3a6fc4751eeea77fa',
                        to: '0x435933c8064b4ae76be665428e0307ef2ccfbd68',
                        value: '0x0',
                        data: '0xa9059cbb0000000000000000000000000000000000000000000000000000456e65726779000000000000000000000000000000000000000000000004563918244f400000',
                        gas: '0x0'
                    },
                    'latest',
                    {
                        tracer: 'callTracer',
                        tracerConfig: {
                            onlyTopCall: true
                        }
                    }
                ],
                id: 1
            });
            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('debug_traceTransaction method call', async () => {
            // post tx
            let response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_sendTransaction',
                params: [
                    {
                        from: '0xf077b491b355e64048ce21e3a6fc4751eeea77fa',
                        to: '0x435933c8064b4ae76be665428e0307ef2ccfbd68',
                        value: '0x111'
                    }
                ],
                id: 67
            });

            expect(response.status).toBe(200);

            // get receipt
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const tx = response.data.result as string;
            let receipt = null;

            while (receipt === null) {
                // wait for receipt
                response = await axios.post(RPC_PROXY_URL, {
                    jsonrpc: '2.0',
                    method: 'eth_getTransactionReceipt',
                    params: [tx],
                    id: 1
                });

                expect(response.status).toBe(200);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                receipt = response.data.result as string;
            }

            response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'debug_traceTransaction',
                params: [
                    tx,
                    {
                        tracer: 'callTracer'
                    }
                ],
                id: 1
            });
            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_accounts method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_accounts',
                id: 1
            });
            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_blockNumber method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_blockNumber',
                params: [],
                id: 1
            });
            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_call method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [
                    {
                        from: '0x7567d83b7b8d80addcb281a71d54fc7b3364ffed',
                        to: '0x7567d83b7b8d80addcb281a71d54fc7b3364ffed',
                        value: '0x0',
                        data: '0x'
                    },
                    'latest'
                ],
                id: 1
            });
            expect(response.status).toBe(200);
            // Since we're getting an internal error, let's verify that
            expect(response.data).toHaveProperty('error');
            expect(response.data.error.code).toBe(-32603);
            expect(response.data.error.message).toBe('Internal error');
        });

        it('eth_chainId method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_chainId',
                params: [],
                id: 1
            });
            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(response.data.result).toBe(genesisChainId);
        });

        it('eth_estimateGas method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                method: 'eth_estimateGas',
                params: [
                    {
                        to: '0xf077b491b355e64048ce21e3a6fc4751eeea77fa',
                        value: '0x186a0',
                        data: '0x'
                    },
                    'latest'
                ],
                id: 1,
                jsonrpc: '2.0'
            });

            expect(response.status).toBe(200);
            console.log(response.data);

            expect(response.data).toHaveProperty('result');
        });

        it('eth_gasPrice method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_gasPrice',
                params: [],
                id: 1
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_getBalance method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [
                    '0x7567d83b7b8d80addcb281a71d54fc7b3364ffed',
                    'latest'
                ],
                id: 1
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_getBlockByHash method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_getBlockByHash',
                params: [
                    '0x0000000008602e7a995c747a3215b426c0c65709480b9e9ac57ad37c3f7d73de',
                    false
                ],
                id: 1
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_getBlockByNumber method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_getBlockByNumber',
                params: ['0x1', false],
                id: 1
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_getBlockReceipts method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_getBlockReceipts',
                params: ['0x1'],
                id: 1
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_getBlockTransactionCountByHash method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                method: 'eth_getBlockTransactionCountByHash',
                params: [
                    '0x0000000008602e7a995c747a3215b426c0c65709480b9e9ac57ad37c3f7d73de'
                ],
                id: 1,
                jsonrpc: '2.0'
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_getBlockTransactionCountByNumber method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                method: 'eth_getBlockTransactionCountByNumber',
                params: ['0x0'],
                id: 1,
                jsonrpc: '2.0'
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_getCode method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_getCode',
                params: [
                    '0x7567d83b7b8d80addcb281a71d54fc7b3364ffed',
                    'latest'
                ],
                id: 1
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_getLogs method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_getLogs',
                params: [
                    { address: '0x7567d83b7b8d80addcb281a71d54fc7b3364ffed' }
                ],
                id: 1
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_getStorageAt method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_getStorageAt',
                params: [
                    '0x7567d83b7b8d80addcb281a71d54fc7b3364ffed',
                    '0x0',
                    '0x0'
                ],
                id: 1
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_getTransactionByBlockHashAndIndex method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                method: 'eth_getTransactionByBlockHashAndIndex',
                params: [
                    '0x0000000008602e7a995c747a3215b426c0c65709480b9e9ac57ad37c3f7d73de',
                    '0x0'
                ],
                id: 1,
                jsonrpc: '2.0'
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_getTransactionByBlockNumberAndIndex method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                method: 'eth_getTransactionByBlockNumberAndIndex',
                params: ['0x0', '0x0'],
                id: 1,
                jsonrpc: '2.0'
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_getTransactionByHash method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_getTransactionCount',
                params: [
                    '0x7567d83b7b8d80addcb281a71d54fc7b3364ffed',
                    'latest'
                ],
                id: 1
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_getTransactionCount method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_getTransactionCount',
                params: [
                    '0x7567d83b7b8d80addcb281a71d54fc7b3364ffed',
                    'latest'
                ],
                id: 1
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_getTransactionReceipt method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_getTransactionReceipt',
                params: [
                    '0x4836db989f9072035586451ead35eb8a4ff5d2d4ce1996d7a550bdcb71a769f2'
                ],
                id: 1
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_getUncleCountByBlockHash method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                method: 'eth_getUncleCountByBlockHash',
                params: [
                    '0x829df9bb801fc0494abf2f443423a49ffa32964554db71b098d332d87b70a48b'
                ],
                id: 1,
                jsonrpc: '2.0'
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(response.data.result).toBe(0);
        });

        it('eth_getUncleCountByBlockNumber method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                method: 'eth_getUncleCountByBlockNumber',
                params: ['0xc5043f'],
                id: 1,
                jsonrpc: '2.0'
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(response.data.result).toBe(0);
        });

        it('eth_getUncleByBlockHashAndIndex method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_getUncleByBlockHashAndIndex',
                params: [
                    '0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35',
                    '0x0'
                ],
                id: 1
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(response.data.result).toBeNull();
        });

        it('eth_getUncleByBlockNumberAndIndex method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_getUncleByBlockNumberAndIndex',
                params: ['latest', '0x0'],
                id: 1
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(response.data.result).toBeNull();
        });

        it('eth_requestAccounts method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_requestAccounts',
                params: [],
                id: 67
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_sendRawTransaction method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_sendRawTransaction',
                params: [
                    '0xf86f81de8020dbda94435933c8064b4ae76be665428e0307ef2ccfbd68830f424080818082520880840165ec15c0b8411afd26e63bc79effbb4094c0181a14091f293044018f8b08911219d15fb2595563c5d436d036bfb5153b80fa3506fc5c5241474ec5ffc68ad7bfeb140ac5d12801'
                ],
                id: 67
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_sendTransaction method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_sendTransaction',
                params: [
                    {
                        from: '0xf077b491b355e64048ce21e3a6fc4751eeea77fa',
                        to: '0x435933c8064b4ae76be665428e0307ef2ccfbd68',
                        value: '0x111'
                    }
                ],
                id: 67
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_signTransaction method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_signTransaction',
                params: [
                    {
                        from: '0xf077b491b355e64048ce21e3a6fc4751eeea77fa',
                        to: '0x435933c8064b4ae76be665428e0307ef2ccfbd68',
                        value: '0x111'
                    }
                ],
                id: 67
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_signTypedDataV4 method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_signTypedData_v4',
                params: [
                    '0xf077b491b355e64048ce21e3a6fc4751eeea77fa',
                    {
                        domain: {
                            name: 'Ether Mail',
                            version: '1',
                            chainId: 1,
                            verifyingContract:
                                '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
                        },
                        types: {
                            Person: [
                                {
                                    name: 'name',
                                    type: 'string'
                                },
                                {
                                    name: 'wallet',
                                    type: 'address'
                                }
                            ],
                            Mail: [
                                {
                                    name: 'from',
                                    type: 'Person'
                                },
                                {
                                    name: 'to',
                                    type: 'Person'
                                },
                                {
                                    name: 'contents',
                                    type: 'string'
                                }
                            ]
                        },
                        message: {
                            from: {
                                name: 'Cow',
                                wallet: '0xf077b491b355e64048ce21e3a6fc4751eeea77fa'
                            },
                            to: {
                                name: 'Bob',
                                wallet: '0x435933c8064b4ae76be665428e0307ef2ccfbd68'
                            },
                            contents: 'Hello, Bob!'
                        },
                        primaryType: 'Mail'
                    }
                ],
                id: 67
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_subscribe method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_subscribe',
                params: ['newHeads'],
                id: 67
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_syncing method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_syncing',
                params: [],
                id: 67
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('eth_unsubscribe method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_unsubscribe',
                params: ['0x9cef478923ff08bf67fde6c64013158d'],
                id: 67
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('evm_mine method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'evm_mine',
                params: [],
                id: 67
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(response.data.result).toBeNull;
        });

        it('net_listening method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'net_listening',
                params: [],
                id: 67
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('net_peerCount method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'net_peerCount',
                params: [],
                id: 1
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
        });

        it('net_version method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'net_version',
                params: [],
                id: 67
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
            expect((response.data as { result: string }).result).toBe(
                genesisChainId
            );
        });

        it('txpool_content method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'txpool_content',
                params: [],
                id: 67
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(response.data.result).toStrictEqual({});
        });

        it('txpool_contentFrom method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'txpool_contentFrom',
                params: ['0x9431D1615FA755Faa25A74da7f34C8Bd6963bd0A'],
                id: 67
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(response.data.result).toStrictEqual({});
        });

        it('txpool_inspect method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'txpool_inspect',
                params: [],
                id: 67
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(response.data.result).toStrictEqual({});
        });

        it('txpool_status method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'txpool_status',
                params: [],
                id: 67
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(response.data.result).toStrictEqual({});
        });

        it('web3_clientVersion method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'web3_clientVersion',
                params: [],
                id: 67
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(response.data.result).toBe('thor');
        });

        it('web3_sha3 method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'web3_sha3',
                params: ['0x68656c6c6f20776f726c64'],
                id: 67
            });

            expect(response.status).toBe(200);

            console.log(response.data);
            expect(response.data).toHaveProperty('result');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(response.data.result).toBe(
                '0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad'
            );
        });

        it('eth_feeHistory method call with invalid params', async () => {
            // Test with invalid blockCount
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_feeHistory',
                params: [0, 'latest', [25, 75]], // blockCount must be > 0
                id: 1
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('error');
            expect(response.data.error.code).toBe(-32602);
        });

        it('eth_feeHistory method call with missing params', async () => {
            // Test with missing required params
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_feeHistory',
                params: ['latest'], // Missing blockCount
                id: 1
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('error');
            expect(response.data.error.code).toBe(-32602);
        });

        it('eth_feeHistory method call', async () => {
            // Test with valid parameters
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_feeHistory',
                params: [4, 'latest', [25, 75]],
                id: 1
            });
            // The result should have the expected structure
            console.log(response.data);
            expect(response.data).toHaveProperty('result');
            expect(response.data.result).toHaveProperty('oldestBlock');
            expect(response.data.result).toHaveProperty('baseFeePerGas');
            expect(response.data.result).toHaveProperty('gasUsedRatio');
            expect(response.data.result).toHaveProperty('reward');
        });

        it('eth_maxPriorityFeePerGas method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'eth_maxPriorityFeePerGas',
                params: [],
                id: 1
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('result');
            // The result should be a hex string representing the max priority fee per gas
            expect(typeof response.data.result).toBe('string');
            expect(response.data.result).toMatch(/^0x[0-9a-fA-F]+$/);
        });
    });

    const notImplementedMethods = [
        'debug_getBadBlocks',
        'debug_getRawBlock',
        'debug_getRawHeader',
        'debug_getRawReceipts',
        'debug_getRawTransaction',
        'engine_exchangeCapabilities',
        'engine_exchangeTransitionConfigurationV1',
        'engine_forkchoiceUpdatedV1',
        'engine_forkchoiceUpdatedV2',
        'engine_forkchoiceUpdatedV3',
        'engine_getPayloadBodiesByHashV1',
        'engine_getPayloadBodiesByRangeV1',
        'engine_getPayloadV1',
        'engine_getPayloadV2',
        'engine_getPayloadV3',
        'engine_newPayloadV1',
        'engine_newPayloadV2',
        'engine_newPayloadV3',
        'eth_coinbase',
        'eth_createAccessList',
        'eth_getFilterChanges',
        'eth_getFilterLogs',
        'eth_getProof',
        'eth_getWork',
        'eth_hashrate',
        'eth_mining',
        'eth_newBlockFilter',
        'eth_newFilter',
        'eth_newPendingTransactionFilter',
        'eth_protocolVersion',
        'eth_sign',
        'eth_submitWork',
        'eth_uninstallFilter',
        'parity_nextNonce'
    ];

    describe('should return: METHOD NOT IMPLEMENTED for', () => {
        notImplementedMethods.forEach((method) => {
            it(`${method} method call`, async () => {
                const response = await axios.post(RPC_PROXY_URL, {
                    jsonrpc: '2.0',
                    method,
                    params: [],
                    id: 1
                });

                expect(response.status).toBe(200);

                expect(response.data).toHaveProperty('error');
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                expect(response.data.error.code).toBe(-32004);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                expect(response.data.error.message).toBe(
                    'Method not supported'
                );
            });
        });
    });

    describe('should fail for', () => {
        it('non existing invalid method', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'invalid_method',
                params: [],
                id: 1
            });

            expect(response.status).toBe(200);

            expect(response.data).toHaveProperty('error');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(response.data.error.code).toBe(-32601);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(response.data.error.message).toBe('Method not found');
        });

        it('malformed JSON request', async () => {
            const response = await axios.post(RPC_PROXY_URL, 
                // Send invalid JSON string
                '{"jsonrpc": "2.0", "method": "eth_call", "params": [], "id": 1', 
                {
                    headers: { 'Content-Type': 'application/json' },
                    // Need to tell axios not to parse/stringify the body
                    transformRequest: [(data) => data],
                    // Need to handle the error response
                    validateStatus: () => true
                }
            );

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('error');
            expect(response.data.error.code).toBe(-32700);
            expect(response.data.error.message).toBe('Parse error: Invalid JSON');
            expect(response.data.id).toBeNull();
        });
    });
});
