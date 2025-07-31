import { useState } from 'react';
import { motion } from 'framer-motion';

// Image assets from Figma
const imgFrame = "http://localhost:3845/assets/1b6af1c180620a49100b0962fb1d65b7e7bd3b37.svg";
const imgFrame1 = "http://localhost:3845/assets/b0e67450fceff8fac833144bf5332ecbfb863713.svg";
const imgFrame2 = "http://localhost:3845/assets/5c772275f3ad2c1bba8185a553819583765d121a.svg";
const imgFrame3 = "http://localhost:3845/assets/d6e6884bb2193e7557212a0bba9083f83eb8943f.svg";
const imgFrame4 = "http://localhost:3845/assets/e8d4e82d2853512e6ba5e45c1cd9aa4fafe8d03d.svg";
const imgFrame5 = "http://localhost:3845/assets/55bd8dfadef68bf72eb7d5c4962acd07c46c0351.svg";

export default function Review() {
  const [fromAmount, setFromAmount] = useState('0.00');
  const [toAmount, setToAmount] = useState('0.00');
  const [isLoading, setIsLoading] = useState(false);

  const handleSwapTokens = () => {
    setIsLoading(true);
    // Simulate swap processing
    setTimeout(() => {
      window.location.href = '/progress';
    }, 2000);
  };

  return (
    <div className="bg-[#ffffff] box-border content-stretch flex flex-col items-start justify-start p-0 relative size-full">
      <div className="bg-[#ffffff] box-border content-stretch flex flex-col items-start justify-start overflow-clip p-0 relative shrink-0 w-full">
        <div className="bg-[#f2f2f7] box-border content-stretch flex flex-col items-start justify-start pb-[107.667px] pl-[396.333px] pr-[396.667px] pt-[107.333px] relative shrink-0 w-full">
          <div className="h-[660px] relative shrink-0 w-[480px]">
            {/* Progress Indicators */}
            <div className="absolute box-border content-stretch flex flex-row gap-3 items-start justify-center left-0 pb-[0.333px] pl-0 pr-[0.333px] pt-0 top-0">
              <div className="bg-[#ffffff] box-border content-stretch flex flex-col items-start justify-start p-[12px] relative rounded-[2.23696e+07px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.1)] shrink-0">
                <div className="relative shrink-0 size-4">
                  <img
                    alt="Step 1"
                    className="block max-w-none size-full"
                    src={imgFrame}
                  />
                </div>
              </div>
              <div className="bg-[#ffffff] box-border content-stretch flex flex-col items-start justify-start p-[12px] relative rounded-[2.23696e+07px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.1)] shrink-0">
                <div className="relative shrink-0 size-4">
                  <img
                    alt="Step 2"
                    className="block max-w-none size-full"
                    src={imgFrame1}
                  />
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="absolute box-border content-stretch flex flex-col gap-[26.667px] items-center justify-end left-0 pb-[0.333px] pl-0 pr-[0.333px] pt-[63.667px] top-0">
              {/* From Token Card */}
              <div className="bg-[#ffffff] box-border content-stretch flex flex-col gap-[15.833px] items-end justify-center pb-6 pl-6 pr-[23.667px] pt-[24.333px] relative rounded-[30px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] shrink-0 w-full">
                <div className="box-border content-stretch flex flex-row items-center justify-between p-0 relative shrink-0 w-full">
                  <div className="bg-[#f2f2f7] box-border content-stretch flex flex-row gap-2 items-center justify-end px-3 py-2 relative rounded-[20px] shrink-0">
                    <div className="bg-[#627eea] box-border content-stretch flex flex-col items-start justify-start p-[6px] relative rounded-[2.23696e+07px] shrink-0">
                      <div className="relative shrink-0 size-3">
                        <img
                          alt="ETH"
                          className="block max-w-none size-full"
                          src={imgFrame2}
                        />
                      </div>
                    </div>
                    <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#000000] text-[16px] text-center text-nowrap">
                      <p className="block leading-[24px] whitespace-pre">ETH</p>
                    </div>
                    <div className="relative shrink-0 size-3">
                      <img
                        alt="Arrow"
                        className="block max-w-none size-full"
                        src={imgFrame3}
                      />
                    </div>
                  </div>
                  <div className="box-border content-stretch flex flex-col font-['Inter:Regular',_sans-serif] font-normal gap-[7.667px] items-end justify-center leading-[0] not-italic pb-[2.333px] pt-0 px-0 relative shrink-0 text-[12px] text-nowrap">
                    <div className="h-[18px] relative shrink-0 text-[rgba(0,0,0,0.5)] text-right w-[91.896px]">
                      <div className="absolute left-[48.56px] top-[-0.33px] translate-x-[-100%]">
                        <p className="block leading-[18px] text-nowrap whitespace-pre">
                          Balance:
                        </p>
                      </div>
                      <div className="absolute left-[91.56px] top-[-0.33px] translate-x-[-100%]">
                        <p className="block leading-[18px] text-nowrap whitespace-pre">
                          2.4567
                        </p>
                      </div>
                    </div>
                    <div className="relative shrink-0 text-[#007aff] text-center">
                      <p className="block leading-[18px] text-nowrap whitespace-pre">
                        Max
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-[32px] text-left text-nowrap">
                  <p className="block leading-[normal] whitespace-pre">{fromAmount}</p>
                </div>
                <div className="bg-[#f2f2f7] box-border content-stretch flex flex-col items-start justify-start pb-1.5 pt-2 px-3 relative rounded-2xl shrink-0">
                  <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[12px] text-[rgba(0,0,0,0.5)] text-left text-nowrap">
                    <p className="block leading-[18px] whitespace-pre">
                      Get Best Price by 1inch
                    </p>
                  </div>
                </div>
              </div>

              {/* Swap Arrow */}
              <div className="bg-[#ffffff] box-border content-stretch flex flex-col items-start justify-start p-[14px] relative rounded-[2.23696e+07px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.1)] shrink-0">
                <div className="relative shrink-0 size-5">
                  <img
                    alt="Swap"
                    className="block max-w-none size-full"
                    src={imgFrame4}
                  />
                </div>
              </div>

              {/* To Token Card */}
              <div className="bg-[#ffffff] box-border content-stretch flex flex-col gap-[15.833px] items-end justify-center pb-6 pl-6 pr-[23.667px] pt-[24.333px] relative rounded-[30px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] shrink-0 w-full">
                <div className="box-border content-stretch flex flex-row items-center justify-between p-0 relative shrink-0 w-full">
                  <div className="bg-[#f2f2f7] box-border content-stretch flex flex-row gap-[8.5px] items-center justify-end pl-3 pr-[11px] py-2 relative rounded-[20px] shrink-0">
                    <div className="bg-[#000000] box-border content-stretch flex flex-col items-start justify-start p-[6px] relative rounded-[2.23696e+07px] shrink-0">
                      <div className="relative shrink-0 size-3">
                        <img
                          alt="XLM"
                          className="block max-w-none size-full"
                          src={imgFrame5}
                        />
                      </div>
                    </div>
                    <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#000000] text-[16px] text-center text-nowrap">
                      <p className="block leading-[24px] whitespace-pre">XLM</p>
                    </div>
                    <div className="relative shrink-0 size-3">
                      <img
                        alt="Arrow"
                        className="block max-w-none size-full"
                        src={imgFrame3}
                      />
                    </div>
                  </div>
                  <div className="box-border content-stretch flex flex-col font-['Inter:Regular',_sans-serif] font-normal gap-[7.667px] items-end justify-center leading-[0] not-italic pb-[2.333px] pt-0 px-0 relative shrink-0 text-[12px] text-nowrap">
                    <div className="h-[18px] relative shrink-0 text-[rgba(0,0,0,0.5)] text-right w-[101.573px]">
                      <div className="absolute left-[102.24px] top-[-0.33px] translate-x-[-100%]">
                        <p className="block leading-[18px] text-nowrap whitespace-pre">
                          5,678.90
                        </p>
                      </div>
                      <div className="absolute left-[49.24px] top-[-0.33px] translate-x-[-100%]">
                        <p className="block leading-[18px] text-nowrap whitespace-pre">
                          Balance:
                        </p>
                      </div>
                    </div>
                    <div className="relative shrink-0 text-[#007aff] text-center">
                      <p className="block leading-[18px] text-nowrap whitespace-pre">
                        Max
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-[32px] text-left text-nowrap">
                  <p className="block leading-[normal] whitespace-pre">{toAmount}</p>
                </div>
                <div className="bg-[#f2f2f7] box-border content-stretch flex flex-col items-start justify-start pb-1.5 pt-2 px-3 relative rounded-2xl shrink-0">
                  <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[12px] text-[rgba(0,0,0,0.5)] text-left text-nowrap">
                    <p className="block leading-[18px] whitespace-pre">
                      Get Best Price by 1inch
                    </p>
                  </div>
                </div>
              </div>

              {/* Swap Tokens Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSwapTokens}
                disabled={isLoading}
                className="bg-[#007aff] box-border content-stretch flex flex-col items-start justify-start pl-[190px] pr-[189px] py-4 relative rounded-[30px] shrink-0 w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[16px] text-center text-nowrap">
                  <p className="block leading-[24px] whitespace-pre">
                    {isLoading ? 'Processing...' : 'Swap Tokens'}
                  </p>
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 