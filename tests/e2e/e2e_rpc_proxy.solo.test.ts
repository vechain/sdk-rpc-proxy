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
const RPC_PROXY_URL = `http://localhost:8545`;
const genesisChainId = '0xde'; // custom genesis block id as solo is using a custom genesis file

beforeEach(async () => {
    thorClient = ThorClient.at(RPC_PROXY_URL);
    isGalacticaActive = await thorClient.forkDetector.detectGalactica();
});

let thorClient: ThorClient;
let isGalacticaActive: boolean;

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
        /*
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
        */

        it('evm_mine method call', async () => {
            const response = await axios.post(RPC_PROXY_URL, {
                jsonrpc: '2.0',
                method: 'evm_mine',
                params: [],
                id: 67
            });

            expect(response.status).toBe(200);
            expect(response.data.result).toBe(null);
            console.log(response.data);

        });

        /*
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
        */
    });

    /*
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
    */
});
