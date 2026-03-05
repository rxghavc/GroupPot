/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoteForm } from '@/components/ui/VoteForm';
import type { BetOption } from '@/lib/types';

const options: BetOption[] = [
  { id: 'o1', text: 'Team A', votes: [] },
  { id: 'o2', text: 'Team B', votes: [] },
  { id: 'o3', text: 'Draw', votes: [] },
];

describe('VoteForm (component)', () => {
  it('submits single-vote payload with selected option and stake', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    const onCancel = jest.fn();

    render(
      <VoteForm
        betId="b1"
        options={options}
        minStake={1}
        maxStake={100}
        votingType="single"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole('radio', { name: /team a/i }));

    const stakeInput = screen.getByRole('spinbutton');
    await user.clear(stakeInput);
    await user.type(stakeInput, '12');

    await user.click(screen.getByRole('button', { name: /place vote/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ optionId: 'o1', stake: 12 });
  });

  it('submits multi-vote batch payload with per-option stakes', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    const onCancel = jest.fn();

    render(
      <VoteForm
        betId="b2"
        options={options}
        minStake={1}
        maxStake={50}
        votingType="multi"
        multiVoteType="partial_match"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole('checkbox', { name: /team a/i }));
    await user.click(screen.getByRole('checkbox', { name: /team b/i }));

    const stakeInputs = screen.getAllByPlaceholderText(/stake for this option/i);
    await user.clear(stakeInputs[0]);
    await user.type(stakeInputs[0], '7');
    await user.clear(stakeInputs[1]);
    await user.type(stakeInputs[1], '9');

    await user.click(screen.getByRole('button', { name: /place votes/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      votes: [
        { optionId: 'o1', stake: 7 },
        { optionId: 'o2', stake: 9 },
      ],
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    const onCancel = jest.fn();

    render(
      <VoteForm
        betId="b3"
        options={options}
        minStake={1}
        maxStake={50}
        votingType="single"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
