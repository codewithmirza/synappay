import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Image assets from Figma
const imgFrame = "http://localhost:3845/assets/a0d93239355829e4c4b530c90275fda978e91db2.svg";
const imgFrame1 = "http://localhost:3845/assets/6a785f892c3be9f8d3fb0e6a3d1e9220f4a4283b.svg";
const imgFrame2 = "http://localhost:3845/assets/93e8862adcb2a25efb017b0a7b66eccc937cfb6c.svg";
const imgFrame3 = "http://localhost:3845/assets/9ed60ebac51962657d4c62f72d5444029472e092.svg";

export default function Progress() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Simulate progress through steps
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < 4) {
          return prev + 1;
        } else {
          setIsComplete(true);
          clearInterval(timer);
          return prev;
        }
      });
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const steps = [
    {
      id: 1,
      title: "Locking on Ethereum",
      description: "Confirming transaction on Ethereum network...",
      icon: imgFrame,
      isActive: currentStep >= 1,
      isComplete: currentStep > 1
    },
    {
      id: 2,
      title: "Locking on Stellar",
      description: "Waiting for Ethereum confirmation...",
      icon: imgFrame1,
      isActive: currentStep >= 2,
      isComplete: currentStep > 2
    },
    {
      id: 3,
      title: "Awaiting Resolver/Secret",
      description: "Waiting for Stellar lock...",
      icon: imgFrame2,
      isActive: currentStep >= 3,
      isComplete: currentStep > 3
    },
    {
      id: 4,
      title: "Swap Complete",
      description: "Waiting for secret verification...",
      icon: imgFrame3,
      isActive: currentStep >= 4,
      isComplete: isComplete
    }
  ];

  return (
    <div className="bg-[#ffffff] box-border content-stretch flex flex-col items-start justify-start p-0 relative size-full">
      <div className="bg-[#ffffff] box-border content-stretch flex flex-col items-start justify-start overflow-clip p-0 relative shrink-0 w-full">
        <div className="bg-[#f2f2f7] box-border content-stretch flex flex-col items-start justify-start pb-16 pt-[63px] px-[385px] relative shrink-0 w-full">
          <div className="bg-[#ffffff] box-border content-stretch flex flex-col gap-12 items-start justify-start overflow-clip pb-[47.667px] pl-[47.833px] pr-[48.167px] pt-[48.333px] relative rounded-[30px] shrink-0">
            {/* Header */}
            <div className="box-border content-stretch flex flex-col font-['Inter:Regular',_sans-serif] font-normal gap-[7px] items-center justify-center leading-[0] not-italic pb-[0.333px] pl-[71.167px] pr-[70.833px] pt-0 relative shrink-0 text-center text-nowrap w-full">
              <div className="relative shrink-0 text-[#0000ee] text-[30px]">
                <p className="block leading-[36px] text-nowrap whitespace-pre">
                  Cross-Chain Swap
                </p>
              </div>
              <div className="relative shrink-0 text-[16px] text-[rgba(0,0,0,0.5)]">
                <p className="block leading-[24px] text-nowrap whitespace-pre">
                  ETH → USDC via Stellar Bridge
                </p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="box-border content-stretch flex flex-col gap-8 items-start justify-end p-0 relative shrink-0 w-full">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="box-border content-stretch flex flex-row gap-6 items-start justify-start p-0 relative shrink-0 w-full"
                >
                  {/* Step Icon */}
                  <div className="box-border content-stretch flex flex-col gap-2 items-center justify-center pb-[0.333px] pl-[0.167px] pr-0 pt-0 relative shrink-0">
                    <div className={`relative rounded-[2.23696e+07px] shrink-0 size-14 ${
                      step.isComplete 
                        ? 'bg-[#007aff]' 
                        : step.isActive 
                          ? 'bg-[#007aff]' 
                          : 'bg-[rgba(0,0,0,0.2)]'
                    }`}>
                      {step.isComplete ? (
                        <div className="absolute left-4 size-6 top-4">
                          <img
                            alt="Complete"
                            className="block max-w-none size-full"
                            src={imgFrame}
                          />
                        </div>
                      ) : step.isActive ? (
                        <div className="absolute left-4 size-6 top-4">
                          <img
                            alt="Active"
                            className="block max-w-none size-full"
                            src={step.icon}
                          />
                        </div>
                      ) : (
                        <div className="absolute left-4 size-6 top-4">
                          <img
                            alt="Pending"
                            className="block max-w-none size-full"
                            src={step.icon}
                          />
                        </div>
                      )}
                      {step.isActive && (
                        <div className="absolute left-[-13px] opacity-[0.162] rounded-[2.23696e+07px] size-[82px] top-[-13px]">
                          <div className="absolute border-2 border-[#007aff] border-solid inset-0 pointer-events-none rounded-[2.23696e+07px]" />
                        </div>
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="bg-[rgba(0,0,0,0.1)] h-[60px] shrink-0 w-0.5" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="box-border content-stretch flex flex-col gap-[7.667px] items-start justify-center pb-[0.333px] pt-3 px-0 relative shrink-0">
                    <div className="box-border content-stretch flex flex-row gap-2 items-start justify-end pl-[0.167px] pr-[110.833px] py-0 relative shrink-0 w-full">
                      <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#000000] text-[18px] text-left text-nowrap">
                        <p className="block leading-[27px] whitespace-pre">
                          {step.title}
                        </p>
                      </div>
                      {step.isActive && !step.isComplete && (
                        <div className="flex h-[39.545px] items-center justify-center relative shrink-0 w-[39.545px]">
                          <div className="flex-none rotate-[47.958deg]">
                            <div className="relative rounded-[2.23696e+07px] size-7">
                              <div className="absolute border-2 border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[2.23696e+07px]" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(0,0,0,0.5)] text-left text-nowrap">
                      <p className="block leading-[21px] whitespace-pre">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Success Message */}
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mt-8"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.location.href = '/swap'}
                  className="bg-[#007aff] text-white px-8 py-4 rounded-[20px] font-['Inter:Regular',_sans-serif] font-normal text-[16px] leading-[24px]"
                >
                  Start New Swap
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 