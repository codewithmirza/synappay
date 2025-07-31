import { useState } from 'react';
import { motion } from 'framer-motion';

// Image assets from Figma
const imgFrame = "http://localhost:3845/assets/4ef9f0c87570c1716223e53c1796c97549633d17.svg";

export default function Swap() {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('2,847.32');
  const [isLoading, setIsLoading] = useState(false);

  const handleReviewSwap = () => {
    if (!fromAmount) {
      alert('Please enter an amount to swap');
      return;
    }
    // Navigate to review page
    window.location.href = '/review';
  };

  return (
    <div className="bg-[#ffffff] box-border content-stretch flex flex-col items-start justify-start p-0 relative size-full">
      <div className="bg-[#ffffff] box-border content-stretch flex flex-col items-start justify-start overflow-clip p-0 relative shrink-0 w-full">
        <div className="bg-[#f2f2f7] box-border content-stretch flex flex-col items-start justify-start pb-[81px] pt-20 px-[385px] relative shrink-0 w-full">
          <div className="bg-[#ffffff] box-border content-stretch flex flex-col gap-8 items-start justify-start overflow-clip pb-[31.667px] pl-[31.833px] pr-[32.167px] pt-[32.333px] relative rounded-[30px] shrink-0">
            {/* Header */}
            <div className="box-border content-stretch flex flex-row gap-[187px] items-center justify-end pb-[0.333px] pl-[0.167px] pr-0 pt-0 relative shrink-0 w-full">
              <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#0000ee] text-[30px] text-left text-nowrap">
                <p className="block leading-[36px] whitespace-pre">
                  Swap Tokens
                </p>
              </div>
              <div className="bg-[#f2f2f7] box-border content-stretch flex flex-col items-start justify-start pb-[15px] pl-[15px] pr-4 pt-4 relative rounded-[2.23696e+07px] shrink-0">
                <div className="shrink-0 size-8">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Swap Interface */}
            <div className="box-border content-stretch flex flex-col gap-6 items-center justify-center pb-[0.333px] pl-[0.167px] pr-0 pt-0 relative shrink-0 w-full">
              {/* From Token */}
              <div className="bg-[#f2f2f7] box-border content-stretch flex flex-col gap-2 items-start justify-center pb-[23.667px] pl-[23.833px] pr-[24.167px] pt-[24.333px] relative rounded-[20px] shrink-0 w-full">
                <div className="box-border content-stretch flex flex-row font-['Inter:Regular',_sans-serif] font-normal items-start justify-between leading-[0] not-italic pb-[0.333px] pl-[0.167px] pr-[0.833px] pt-0 relative shrink-0 text-[14px] text-[rgba(0,0,0,0.5)] text-left text-nowrap w-full">
                  <div className="relative shrink-0">
                    <p className="block leading-[21px] text-nowrap whitespace-pre">
                      From
                    </p>
                  </div>
                  <div className="relative shrink-0">
                    <p className="block leading-[21px] text-nowrap whitespace-pre">
                      Balance: 2.45 ETH
                    </p>
                  </div>
                </div>
                <div className="box-border content-stretch flex flex-row gap-[11.833px] items-center justify-start pl-[0.167px] pr-0 py-0 relative shrink-0">
                  <div className="rounded-[2.23696e+07px] shrink-0 size-10 bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">ETH</span>
                  </div>
                  <div className="font-['Inter:Regular',_sans-serif] font-normal h-[45px] leading-[0] not-italic relative shrink-0 text-left text-nowrap w-[72.208px]">
                    <div className="absolute left-[0.17px] text-[#000000] text-[16px] top-[-0.33px]">
                      <p className="block leading-[24px] text-nowrap whitespace-pre">
                        Ethereum
                      </p>
                    </div>
                    <div className="absolute left-[0.17px] text-[#808080] text-[14px] top-[23.67px]">
                      <p className="block leading-[21px] text-nowrap whitespace-pre">
                        ETH
                      </p>
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[24px] font-['Inter:Regular',_sans-serif] font-normal text-[#000000] leading-[36px]"
                />
              </div>

              {/* Swap Arrow */}
              <div className="bg-[#ffffff] box-border content-stretch flex flex-col items-start justify-start p-[12px] relative rounded-[2.23696e+07px] shadow-[0px_1.13px_2px_0px_rgba(0,0,0,0.25)] shrink-0">
                <div className="relative shrink-0 size-6">
                  <img
                    alt="Swap"
                    className="block max-w-none size-full"
                    src={imgFrame}
                  />
                </div>
              </div>

              {/* To Token */}
              <div className="bg-[#f2f2f7] box-border content-stretch flex flex-col gap-2 items-start justify-center pb-[23.667px] pl-[23.833px] pr-[24.167px] pt-[24.333px] relative rounded-[20px] shrink-0 w-full">
                <div className="box-border content-stretch flex flex-row font-['Inter:Regular',_sans-serif] font-normal items-start justify-between leading-[0] not-italic pb-[0.333px] pl-[0.167px] pr-0 pt-0 relative shrink-0 text-[14px] text-[rgba(0,0,0,0.5)] text-left text-nowrap w-full">
                  <div className="relative shrink-0">
                    <p className="block leading-[21px] text-nowrap whitespace-pre">
                      To
                    </p>
                  </div>
                  <div className="relative shrink-0">
                    <p className="block leading-[21px] text-nowrap whitespace-pre">
                      Balance: 0.00 USDC
                    </p>
                  </div>
                </div>
                <div className="box-border content-stretch flex flex-row items-center justify-between p-0 relative shrink-0 w-full">
                  <div className="box-border content-stretch flex flex-row gap-[11.833px] items-center justify-start pl-[0.167px] pr-0 py-0 relative shrink-0">
                    <div className="rounded-[2.23696e+07px] shrink-0 size-10 bg-blue-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">USDC</span>
                    </div>
                    <div className="font-['Inter:Regular',_sans-serif] font-normal h-[45px] leading-[0] not-italic relative shrink-0 text-left text-nowrap w-[72.833px]">
                      <div className="absolute left-[0.17px] text-[#000000] text-[16px] top-[-0.33px]">
                        <p className="block leading-[24px] text-nowrap whitespace-pre">
                          USD Coin
                        </p>
                      </div>
                      <div className="absolute left-[0.17px] text-[#808080] text-[14px] top-[23.67px]">
                        <p className="block leading-[21px] text-nowrap whitespace-pre">
                          USDC
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#000000] text-[24px] text-nowrap text-right">
                    <p className="block leading-[36px] whitespace-pre">
                      {toAmount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Swap Details */}
              <div className="bg-[#f2f2f7] box-border content-stretch flex flex-col gap-2 items-start justify-center pb-[15.667px] pl-[15.833px] pr-[16.167px] pt-[16.333px] relative rounded-2xl shrink-0 w-full">
                <div className="box-border content-stretch flex flex-row font-['Inter:Regular',_sans-serif] font-normal items-start justify-between leading-[0] not-italic pb-[0.333px] pl-[0.167px] pr-0 pt-0 relative shrink-0 text-[14px] text-left text-nowrap w-full">
                  <div className="relative shrink-0 text-[rgba(0,0,0,0.5)]">
                    <p className="block leading-[21px] text-nowrap whitespace-pre">
                      Rate
                    </p>
                  </div>
                  <div className="relative shrink-0 text-[#000000]">
                    <p className="block leading-[21px] text-nowrap whitespace-pre">
                      1 ETH = 2,847.32 USDC
                    </p>
                  </div>
                </div>
                <div className="box-border content-stretch flex flex-row font-['Inter:Regular',_sans-serif] font-normal items-start justify-between leading-[0] not-italic pb-[0.333px] pl-[0.167px] pr-[0.833px] pt-0 relative shrink-0 text-[14px] text-left text-nowrap w-full">
                  <div className="relative shrink-0 text-[rgba(0,0,0,0.5)]">
                    <p className="block leading-[21px] text-nowrap whitespace-pre">
                      Network Fee
                    </p>
                  </div>
                  <div className="relative shrink-0 text-[#000000]">
                    <p className="block leading-[21px] text-nowrap whitespace-pre">
                      ~$12.50
                    </p>
                  </div>
                </div>
                <div className="box-border content-stretch flex flex-row font-['Inter:Regular',_sans-serif] font-normal items-start justify-between leading-[0] not-italic pb-[0.333px] pl-[0.167px] pr-[0.833px] pt-0 relative shrink-0 text-[14px] text-left text-nowrap w-full">
                  <div className="relative shrink-0 text-[rgba(0,0,0,0.5)]">
                    <p className="block leading-[21px] text-nowrap whitespace-pre">
                      Slippage
                    </p>
                  </div>
                  <div className="relative shrink-0 text-[#000000]">
                    <p className="block leading-[21px] text-nowrap whitespace-pre">
                      0.5%
                    </p>
                  </div>
                </div>
              </div>

              {/* Review Swap Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleReviewSwap}
                disabled={!fromAmount || isLoading}
                className="bg-[#000000] box-border content-stretch flex flex-col items-start justify-start px-[169px] py-4 relative rounded-[20px] shrink-0 w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[16px] text-center text-nowrap">
                  <p className="block leading-[24px] whitespace-pre">
                    {isLoading ? 'Processing...' : 'Review Swap'}
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