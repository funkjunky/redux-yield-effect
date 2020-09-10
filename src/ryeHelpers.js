import { endRyeGeneratorCreator } from './endRyeGeneratorActionCreator';

export const getRyeHelpers = ({ dispatch, activeGenerators, effectProcessors }) => {
  const { effectGeneratorProcessor, recursivelyProcessGenerator, processEffect } = {
    effectGeneratorProcessor: generator => {
      activeGenerators.push(generator);

      return {
        endGeneratorAction: endRyeGeneratorCreator(generator),
        result: recursivelyProcessGenerator(generator, {}),
      };
    },

    recursivelyProcessGenerator: async (generator, prevYield) => {
      if (prevYield.done) return Promise.resolve(prevYield.value);

      // TODO: need to identify effects better, than { type } existing
      // TODO: im not sure all of the awaits are necessary
      if (!prevYield.value?.type) {
        return recursivelyProcessGenerator(generator, await generator.next(prevYield.value));
      } else {
        return await processEffect(generator, prevYield.value);
      }
    },

    processEffect: async (generator, effect) => {
      const effectPromise = effectProcessors[effect.type](effect, { dispatch, effectGeneratorProcessor });
      return await effectPromise.then(
        async result => recursivelyProcessGenerator(generator, await generator.next(result)),
        async error => recursivelyProcessGenerator(generator, await generator.throw(error)),
      );
    },
  };
  return { effectGeneratorProcessor, recursivelyProcessGenerator, processEffect };
};
