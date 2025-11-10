import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedWhistleBlower = deploy("WhistleBlower", {
    from: deployer,
    log: true,
  });

  console.log(`WhistleBlower contract: `, deployedWhistleBlower);
};
export default func;
func.id = "deploy_whistleBlower"; // id required to prevent reexecution
func.tags = ["WhistleBlower"];
